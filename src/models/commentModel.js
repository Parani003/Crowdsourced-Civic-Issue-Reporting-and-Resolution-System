import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    issue: {
      type: mongoose.Schema.ObjectId,
      ref: 'Issue',
      required: [true, 'A comment must belong to an issue'],
      index: true,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A comment must have an author'],
    },
    text: {
      type: String,
      required: [true, 'Comment content cannot be empty'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
