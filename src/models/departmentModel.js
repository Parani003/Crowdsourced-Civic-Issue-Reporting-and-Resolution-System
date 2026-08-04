import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A department must have a name'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    categories: [
      {
        type: String,
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
    ],
  },
  { timestamps: true }
);

const Department = mongoose.model('Department', departmentSchema);

export default Department;
