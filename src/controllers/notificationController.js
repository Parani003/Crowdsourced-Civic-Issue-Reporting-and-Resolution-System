import Notification from '../models/notificationModel.js';
import User from '../models/userModel.js';
import AppError from '../utils/appError.js';
import { sendEmail } from '../utils/email.js';

// Controller actions
export const getUserNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort('-createdAt')
      .limit(50); // Cap at 50 recent alerts

    res.status(200).json({
      status: 'success',
      results: notifications.length,
      data: {
        notifications,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return next(new AppError('No notification found with that ID.', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        notification,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read.',
    });
  } catch (err) {
    next(err);
  }
};

// Global helper function to create in-app notification and dispatch simulated email
export const triggerNotification = async ({ recipientId, senderId, issueId, type, message }) => {
  try {
    // 1) Save database notification
    const alert = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      issue: issueId,
      type,
      message,
    });

    // 2) Fetch user details to get target email
    const user = await User.findById(recipientId);
    if (!user) return alert;

    // 3) Send email copy
    let emailSubject = 'CivicConnect Update';
    if (type === 'complaint_received') emailSubject = 'CivicConnect: Complaint Received';
    if (type === 'assigned') emailSubject = 'CivicConnect: Issue Assigned to Officer';
    if (type === 'in_progress') emailSubject = 'CivicConnect: Issue Under Resolution';
    if (type === 'resolved') emailSubject = 'CivicConnect: Issue Resolved successfully';
    if (type === 'rejected') emailSubject = 'CivicConnect: Issue Submission Update';
    if (type === 'comment_added') emailSubject = 'CivicConnect: New comment on ticket';

    await sendEmail({
      email: user.email,
      subject: emailSubject,
      message: `${message}\n\nTrack the status updates in your CivicConnect portal:\nhttp://localhost:3000/issues/${issueId}`,
    });

    return alert;
  } catch (err) {
    console.error('Error dispatching notifications:', err.message);
  }
};
