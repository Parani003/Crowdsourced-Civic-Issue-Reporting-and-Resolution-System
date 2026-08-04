import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validate, registerSchema, loginSchema } from '../middlewares/validationMiddleware.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);

// Secured/Protected endpoints
router.get('/me', protect, getMe);

export default router;
