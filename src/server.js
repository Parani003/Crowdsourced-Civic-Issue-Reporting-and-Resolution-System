import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message, err.stack);
  process.exit(1);
});

dotenv.config();

import app from './app.js';

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable is missing!');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('DB connection successful!'))
  .catch((err) => {
    console.error('DB connection failed! 💥', err.message);
    process.exit(1);
  });

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
