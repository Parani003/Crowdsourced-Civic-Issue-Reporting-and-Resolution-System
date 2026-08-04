import User from '../models/userModel.js';
import AppError from '../utils/appError.js';

export const getOfficers = async (req, res, next) => {
  try {
    // Fetch all users with the officer role, populating their assigned department name
    const officers = await User.find({ role: 'officer' }).populate('department', 'name');

    res.status(200).json({
      status: 'success',
      results: officers.length,
      data: {
        officers,
      },
    });
  } catch (err) {
    next(err);
  }
};
