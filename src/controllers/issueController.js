import Issue from '../models/issueModel.js';
import Department from '../models/departmentModel.js';
import AppError from '../utils/appError.js';
import { isCloudinaryConfigured } from '../middlewares/uploadMiddleware.js';
import { triggerNotification } from './notificationController.js';

export const checkDuplicate = async (req, res, next) => {
  try {
    const { category, longitude, latitude } = req.body;

    if (!category || longitude === undefined || latitude === undefined) {
      return next(new AppError('Please provide category, longitude, and latitude.', 400));
    }

    // Run geospatial query to find unresolved issues of same category within 50 meters
    const duplicate = await Issue.findOne({
      category,
      status: { $nin: ['resolved', 'rejected'] },
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: 50, // 50 meters
        },
      },
    }).populate('createdBy', 'name');

    if (duplicate) {
      return res.status(200).json({
        status: 'success',
        isDuplicate: true,
        data: {
          issue: duplicate,
        },
      });
    }

    res.status(200).json({
      status: 'success',
      isDuplicate: false,
    });
  } catch (err) {
    next(err);
  }
};

export const createIssue = async (req, res, next) => {
  try {
    const { category, description, address, longitude, latitude, priority } = req.body;

    if (!req.file) {
      return next(new AppError('Please provide an image of the civic issue.', 400));
    }

    if (!category || !description || !address || longitude === undefined || latitude === undefined) {
      return next(new AppError('Required reporting fields are missing.', 400));
    }

    // Resolve Image URI (Cloudinary link or backend host file path)
    let imageUrl;
    if (isCloudinaryConfigured) {
      imageUrl = req.file.path;
    } else {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Attempt automatic assignment to department handling this category
    const matchedDept = await Department.findOne({ categories: category });

    const newIssue = await Issue.create({
      category,
      description,
      address,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      imageUrl,
      priority: priority || 'medium',
      createdBy: req.user._id,
      department: matchedDept ? matchedDept._id : undefined,
      statusTimeline: [
        {
          status: 'submitted',
          remarks: 'Issue submitted by citizen.',
          updatedBy: req.user._id,
        },
      ],
    });

    // Trigger submission notification
    await triggerNotification({
      recipientId: newIssue.createdBy,
      senderId: req.user._id,
      issueId: newIssue._id,
      type: 'complaint_received',
      message: `Your civic complaint regarding "${category}" at "${address}" has been successfully logged.`,
    });

    res.status(201).json({
      status: 'success',
      data: {
        issue: newIssue,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getAllIssues = async (req, res, next) => {
  try {
    const queryObj = { ...req.query };
    const excludeFields = ['page', 'sort', 'limit', 'fields', 'nearLng', 'nearLat', 'maxDistance'];
    excludeFields.forEach((el) => delete queryObj[el]);

    let query = Issue.find(queryObj);

    // Geospatial Radius Queries (issues within specific range of coordinates)
    if (req.query.nearLng && req.query.nearLat) {
      const lng = parseFloat(req.query.nearLng);
      const lat = parseFloat(req.query.nearLat);
      const maxDistance = parseFloat(req.query.maxDistance) || 5000; // default 5km

      query = Issue.find({
        ...queryObj,
        location: {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            $maxDistance: maxDistance,
          },
        },
      });
    }

    // Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt'); // Default: newest first
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    // Populate Creator & Department details
    const issues = await query
      .populate('createdBy', 'name')
      .populate('department', 'name')
      .populate('assignedTo', 'name');

    res.status(200).json({
      status: 'success',
      results: issues.length,
      data: {
        issues,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('department', 'name')
      .populate('assignedTo', 'name')
      .populate('statusTimeline.updatedBy', 'name role');

    if (!issue) {
      return next(new AppError('No issue found with that ID.', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        issue,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateIssueStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return next(new AppError('No issue found with that ID.', 404));
    }

    // Permissions check
    if (req.user.role === 'officer') {
      const officerDept = req.user.department;
      if (!issue.department || issue.department.toString() !== officerDept.toString()) {
        return next(new AppError('You can only manage issues assigned to your department.', 403));
      }
    }

    if (!status) {
      return next(new AppError('Please provide a status update.', 400));
    }

    issue.status = status;

    // Attach resolution picture if marked resolved
    if (status === 'resolved') {
      if (!req.file) {
        return next(new AppError('Please upload a completion photo to resolve this issue.', 400));
      }
      issue.imageUrl = isCloudinaryConfigured ? req.file.path : `/uploads/${req.file.filename}`;
    }

    issue.statusTimeline.push({
      status,
      remarks: remarks || `Status updated to ${status}.`,
      updatedBy: req.user._id,
    });

    await issue.save();

    // Trigger status change notification
    let notificationType = 'in_progress';
    if (status === 'assigned') notificationType = 'assigned';
    if (status === 'resolved') notificationType = 'resolved';
    if (status === 'rejected') notificationType = 'rejected';

    await triggerNotification({
      recipientId: issue.createdBy,
      senderId: req.user._id,
      issueId: issue._id,
      type: notificationType,
      message: `Update on your ticket "${issue.category}": Status changed to ${status.toUpperCase()}. Remarks: "${remarks || 'Updated by municipal authority'}"`,
    });

    res.status(200).json({
      status: 'success',
      data: {
        issue,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const assignIssue = async (req, res, next) => {
  try {
    const { departmentId, officerId, remarks } = req.body;
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return next(new AppError('No issue found with that ID.', 404));
    }

    if (departmentId) issue.department = departmentId;
    if (officerId) {
      issue.assignedTo = officerId;
      issue.status = 'assigned';
    }

    issue.statusTimeline.push({
      status: officerId ? 'assigned' : issue.status,
      remarks: remarks || `Issue assigned ${officerId ? 'to officer' : 'to department'}.`,
      updatedBy: req.user._id,
    });

    await issue.save();

    // Trigger assignment notification
    await triggerNotification({
      recipientId: issue.createdBy,
      senderId: req.user._id,
      issueId: issue._id,
      type: 'assigned',
      message: `Your ticket regarding "${issue.category}" has been assigned. Remarks: "${remarks || 'Assigned to resolver department'}"`,
    });

    if (officerId) {
      await triggerNotification({
        recipientId: officerId,
        senderId: req.user._id,
        issueId: issue._id,
        type: 'assigned',
        message: `New incident assigned to your queue: "${issue.category}" at "${issue.address}".`,
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        issue,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const toggleUpvote = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return next(new AppError('No issue found with that ID.', 404));
    }

    const userId = req.user._id;
    const upvoteIndex = issue.upvotes.indexOf(userId);

    if (upvoteIndex > -1) {
      // User already upvoted - retract upvote
      issue.upvotes.splice(upvoteIndex, 1);
    } else {
      // Citizen upvoting issue
      issue.upvotes.push(userId);
    }

    await issue.save();

    res.status(200).json({
      status: 'success',
      data: {
        upvotes: issue.upvotes,
        upvoteCount: issue.upvotes.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminAnalytics = async (req, res, next) => {
  try {
    // 1) Category distribution counts
    const categoryStats = await Issue.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 2) Status distribution counts
    const statusStats = await Issue.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // 3) Department resolution performance rates
    const departmentStats = await Issue.aggregate([
      { $match: { status: 'resolved', department: { $exists: true } } },
      {
        $project: {
          department: 1,
          resolutionTimeMs: { $subtract: ['$updatedAt', '$createdAt'] }
        }
      },
      {
        $group: {
          _id: '$department',
          resolvedCount: { $sum: 1 },
          avgResolutionTimeMs: { $avg: '$resolutionTimeMs' }
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'deptInfo'
        }
      },
      { $unwind: '$deptInfo' },
      {
        $project: {
          departmentName: '$deptInfo.name',
          resolvedCount: 1,
          avgResolutionTimeHours: {
            $round: [{ $divide: ['$avgResolutionTimeMs', 1000 * 60 * 60] }, 1]
          }
        }
      },
      { $sort: { resolvedCount: -1 } }
    ]);

    // 4) Overall speed calculations
    const totalCount = await Issue.countDocuments();
    const resolvedIssues = await Issue.find({ status: 'resolved' });
    let avgResolutionTimeHours = 0;
    
    if (resolvedIssues.length > 0) {
      const totalTimeMs = resolvedIssues.reduce(
        (acc, curr) => acc + (new Date(curr.updatedAt) - new Date(curr.createdAt)),
        0
      );
      avgResolutionTimeHours = parseFloat(
        (totalTimeMs / (1000 * 60 * 60 * resolvedIssues.length)).toFixed(1)
      );
    }

    // 5) Monthly complaint trends
    const monthlyTrend = await Issue.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 6 }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        overallStats: {
          totalCount,
          resolvedCount: resolvedIssues.length,
          avgResolutionTimeHours
        },
        categoryStats,
        statusStats,
        departmentStats,
        monthlyTrend
      }
    });
  } catch (err) {
    next(err);
  }
};



