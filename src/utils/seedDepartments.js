import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Department from '../models/departmentModel.js';

dotenv.config();

const DEPARTMENTS = [
  {
    name: 'Public Works & Infrastructure',
    description: 'Responsible for maintenance of roadways, sidewalks, repairing potholes, and structural public repairs.',
    categories: ['Potholes', 'Road Damage'],
  },
  {
    name: 'Sanitation & Waste Management',
    description: 'Handles municipal cleaning, rubbish collection, public toilet facilities, and illegal dumping resolution.',
    categories: ['Garbage Dumps', 'Illegal Dumping', 'Public Toilet Maintenance'],
  },
  {
    name: 'Electricity & Streetlights Office',
    description: 'Manages street illumination, electrical grid hazards, and traffic control signals.',
    categories: ['Broken Streetlights', 'Traffic Signal Failure'],
  },
  {
    name: 'Water & Sewerage Board',
    description: 'Manages freshwater supply, repairs burst pipe leaks, and clears overflowing drainage channels.',
    categories: ['Water Leakage', 'Drainage Problems'],
  },
  {
    name: 'Forestry & Environmental Services',
    description: 'Manages tree growth hazards, handles fallen tree blocks, and cleans green zones.',
    categories: ['Fallen Trees'],
  },
];

const seedDB = async () => {
  try {
    const dbUri = process.env.MONGODB_URI;
    if (!dbUri) {
      console.error('MONGODB_URI environment key is not configured in .env file!');
      process.exit(1);
    }

    await mongoose.connect(dbUri);
    console.log('🔌  Connected to MongoDB cluster for department seeding.');

    // Clear existing values to refresh list
    await Department.deleteMany({});
    console.log('🗑️  Existing department entries cleared.');

    await Department.insertMany(DEPARTMENTS);
    console.log('🌱  Seeding completed. All baseline departments created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌  Seeding failed:', err.message);
    process.exit(1);
  }
};

seedDB();
