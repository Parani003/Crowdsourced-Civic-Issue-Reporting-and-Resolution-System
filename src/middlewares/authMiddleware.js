import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import User from '../models/userModel.js';
import AppError from '../utils/appError.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    
    // 1) Fetch token from authorization header or cookie
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 2) Validate token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Confirm if user still exists in database
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this session token no longer exists.', 401));
    }

    // 4) Grant access and bind session user object to request
    req.user = currentUser;
    next();
  } catch (err) {
    return next(new AppError('Invalid authentication token. Please log in again.', 401));
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};
