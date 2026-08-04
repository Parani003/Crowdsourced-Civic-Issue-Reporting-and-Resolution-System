import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/userModel.js';

dotenv.config();

const email = process.argv[2];

if (!email) {
  console.error('❌  Please specify an email address. Usage: node src/utils/makeAdmin.js <email>');
  process.exit(1);
}

const makeAdmin = async () => {
  try {
    const dbUri = process.env.MONGODB_URI;
    if (!dbUri) {
      console.error('❌  MONGODB_URI environment key is not configured in .env file!');
      process.exit(1);
    }

    await mongoose.connect(dbUri);
    console.log('🔌  Connected to MongoDB cluster.');

    // Elevate user role and set verification state to true
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { role: 'admin', isVerified: true },
      { new: true }
    );

    if (!user) {
      console.error(`❌  No user found matching email address: ${email}`);
      process.exit(1);
    }

    console.log(`\n=============================================================`);
    console.log(`🎉  SUCCESS: Role Elevation Completed!`);
    console.log(`👤  User: ${user.name}`);
    console.log(`📧  Email: ${user.email}`);
    console.log(`🛡️  New Role: ${user.role.toUpperCase()}`);
    console.log(`✅  Verified Status: ${user.isVerified}`);
    console.log(`=============================================================\n`);
    process.exit(0);
  } catch (err) {
    console.error('❌  Elevation failed:', err.message);
    process.exit(1);
  }
};

makeAdmin();
