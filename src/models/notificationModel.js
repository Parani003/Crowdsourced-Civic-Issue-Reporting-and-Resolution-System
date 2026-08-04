import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A notification must have a recipient'],
      index: true,
    },
    sender: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    issue: {
      type: mongoose.Schema.ObjectId,
      ref: 'Issue',
      required: [true, 'A notification must relate to an issue'],
    },
    type: {
      type: String,
      enum: ['complaint_received', 'assigned', 'in_progress', 'resolved', 'rejected', 'comment_added'],
      required: [true, 'A notification must have a type'],
    },
    message: {
      type: String,
      required: [true, 'A notification must have a message body'],
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
