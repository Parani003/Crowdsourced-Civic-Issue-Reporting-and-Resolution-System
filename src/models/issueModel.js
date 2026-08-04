import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, 'An issue must have a category'],
      enum: [
        'Potholes',
        'Garbage Dumps',
        'Broken Streetlights',
        'Water Leakage',
        'Drainage Problems',
        'Illegal Dumping',
        'Fallen Trees',
        'Road Damage',
        'Traffic Signal Failure',
        'Public Toilet Maintenance',
      ],
    },
    description: {
      type: String,
      required: [true, 'An issue must have a description'],
      minlength: [10, 'Description must be at least 10 characters long'],
    },
    address: {
      type: String,
      required: [true, 'An issue must have an address description'],
    },
    location: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'An issue must specify GPS coordinates [longitude, latitude]'],
      },
    },
    imageUrl: {
      type: String,
      required: [true, 'An issue must include a photographic image reference'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['submitted', 'assigned', 'in-progress', 'resolved', 'rejected'],
      default: 'submitted',
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'An issue must be created by a user'],
    },
    assignedTo: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    department: {
      type: mongoose.Schema.ObjectId,
      ref: 'Department',
    },
    upvotes: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    statusTimeline: [
      {
        status: {
          type: String,
          enum: ['submitted', 'assigned', 'in-progress', 'resolved', 'rejected'],
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
        remarks: String,
        updatedBy: {
          type: mongoose.Schema.ObjectId,
          ref: 'User',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Configure indexing systems
issueSchema.index({ location: '2dsphere' });
issueSchema.index({ status: 1 });
issueSchema.index({ category: 1 });

const Issue = mongoose.model('Issue', issueSchema);

export default Issue;
