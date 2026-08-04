import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import AppError from './utils/appError.js';
import globalErrorHandler from './middlewares/errorMiddleware.js';
import authRouter from './routes/authRoutes.js';
import issueRouter from './routes/issueRoutes.js';
import userRouter from './routes/userRoutes.js';
import notificationRouter from './routes/notificationRoutes.js';

const app = express();

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
  });
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 1000, // 1 minute
  message: 'Too many requests from this IP, please try again in a minute!'
});
app.use('/api', limiter);

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  })
);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Base Route / Health Check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is healthy and running!',
    timestamp: new Date().toISOString()
  });
});

// Auth Routes
app.use('/api/v1/auth', authRouter);

// Issue Routes
app.use('/api/v1/issues', issueRouter);

// User Routes
app.use('/api/v1/users', userRouter);

// Notification Routes
app.use('/api/v1/notifications', notificationRouter);

// Serve local static uploads
app.use('/uploads', express.static('public/uploads'));

// Handle unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

export default app;
