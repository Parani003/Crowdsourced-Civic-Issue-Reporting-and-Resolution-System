import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import AppError from '../utils/appError.js';
import { sendEmail } from '../utils/email.js';

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password and sensitive tokens from response body
  user.password = undefined;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email address is already in use.', 400));
    }

    // Citizens can sign up freely, other roles are provisioned
    const newUser = new User({
      name,
      email,
      password,
      role: 'citizen',
    });

    // Generate email verification token
    const verificationRaw = newUser.createVerificationToken();
    await newUser.save();

    // In local development, we console-log the link, but it simulates real SMTP mailing
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${verificationRaw}`;
    
    try {
      await sendEmail({
        email: newUser.email,
        subject: 'Verify your CivicConnect account',
        message: `Welcome to CivicConnect!\n\nPlease verify your account by clicking the following link:\n${verificationUrl}\n\nThis verification link is valid for 24 hours.`,
      });

      res.status(201).json({
        status: 'success',
        message: 'Registration successful! Please check your email to verify your account.',
      });
    } catch (mailErr) {
      // If mail fails, rollback token
      newUser.verificationToken = undefined;
      newUser.verificationTokenExpires = undefined;
      await newUser.save({ validateBeforeSave: false });
      return next(new AppError('Error sending verification email. Please try again later.', 500));
    }
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1) Verify presence of input credentials
    if (!email || !password) {
      return next(new AppError('Please provide email and password!', 400));
    }

    // 2) Fetch user matching email, explicitly selecting password field
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect email or password.', 401));
    }

    // 3) Prevent login if not verified (Civic restriction rule for data transparency)
    if (!user.isVerified) {
      return next(new AppError('Please verify your email address to log in.', 401));
    }

    // 4) Set token
    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

export const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

export const getMe = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
};

export const verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Find user with matching token and valid expiry
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError('Token is invalid or has expired.', 400));
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // Send visual confirmation page (can redirect to React frontend in production)
    res.status(200).send(`
      <div style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #0f172a; color: #f8fafc;">
        <h1 style="color: #6366f1;">CivicConnect Verification</h1>
        <p>Your email has been verified successfully! You can now log into the application.</p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5000'}" style="margin-top: 15px; padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px;">Go to Login</a>
      </div>
    `);
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError('There is no user registered with this email address.', 404));
    }

    // Generate password reset token
    const resetRaw = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send token url link
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetRaw}`;
    const message = `Forgot your password? Reset your password by clicking this link:\n${resetUrl}\n\nIf you did not make this request, please ignore this email.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Reset your CivicConnect password (valid for 10 min)',
        message,
      });

      res.status(200).json({
        status: 'success',
        message: 'Password reset link sent to your email!',
      });
    } catch (mailErr) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new AppError('There was an error sending the password reset email. Please try again later.', 500));
    }
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Get user based on token and validity
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError('Token is invalid or has expired.', 400));
    }

    // Set new password
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    // Automatically verify if resetting password (fallback utility rule)
    if (!user.isVerified) {
      user.isVerified = true;
    }

    await user.save();

    // Log the user in and send JWT
    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};
