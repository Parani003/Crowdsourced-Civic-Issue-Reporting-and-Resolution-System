import { z } from 'zod';
import AppError from '../utils/appError.js';

// Global validator middleware wrapper
export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Map error pathways to clean descriptive messages
      const errorMsg = error.errors
        .map((err) => `${err.path.slice(1).join('.')}: ${err.message}`)
        .join(', ');
      return next(new AppError(errorMsg, 400));
    }
    next(error);
  }
};

// 1) Auth Schema validations
export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
    email: z.string().email({ message: 'Please provide a valid email address' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Please provide a valid email address' }),
    password: z.string().min(1, { message: 'Password field is required' }),
  }),
});

// 2) Issue Schema validations
export const createIssueSchema = z.object({
  body: z.object({
    category: z.string().min(1, { message: 'Please select a valid category' }),
    description: z.string().min(10, { message: 'Description must be at least 10 characters long' }),
    address: z.string().min(1, { message: 'Address description is required' }),
    longitude: z.string().or(z.number()),
    latitude: z.string().or(z.number()),
    priority: z.enum(['low', 'medium', 'high']).optional(),
  }),
});
