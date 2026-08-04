import Comment from '../models/commentModel.js';
import Issue from '../models/issueModel.js';
import AppError from '../utils/appError.js';
import { triggerNotification } from './notificationController.js';

export const getIssueComments = async (req, res, next) => {
  try {
    const { id: issueId } = req.params;

    // Validate that the issue exists
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return next(new AppError('No issue found with that ID.', 404));
    }

    // Retrieve comments sorted from oldest to newest
    const comments = await Comment.find({ issue: issueId })
      .populate('user', 'name role')
      .sort('createdAt');

    res.status(200).json({
      status: 'success',
      results: comments.length,
      data: {
        comments,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const createComment = async (req, res, next) => {
  try {
    const { id: issueId } = req.params;
    const { text } = req.body;

    if (!text) {
      return next(new AppError('Comment text cannot be empty.', 400));
    }

    // Validate that the issue exists
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return next(new AppError('No issue found with that ID.', 404));
    }

    const newComment = await Comment.create({
      issue: issueId,
      user: req.user._id,
      text,
    });

    // Populate user info on the response object before sending
    await newComment.populate('user', 'name role');

    // Trigger notification alert copy
    const isReporter = req.user._id.toString() === issue.createdBy.toString();
    if (isReporter) {
      if (issue.assignedTo) {
        await triggerNotification({
          recipientId: issue.assignedTo,
          senderId: req.user._id,
          issueId: issue._id,
          type: 'comment_added',
          message: `Citizen ${req.user.name} added a new comment on ticket "${issue.category}": "${text}"`,
        });
      }
    } else {
      await triggerNotification({
        recipientId: issue.createdBy,
        senderId: req.user._id,
        issueId: issue._id,
        type: 'comment_added',
        message: `Officer/Admin ${req.user.name} commented on ticket "${issue.category}": "${text}"`,
      });
    }

    res.status(201).json({
      status: 'success',
      data: {
        comment: newComment,
      },
    });
  } catch (err) {
    next(err);
  }
};
