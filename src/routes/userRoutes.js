import express from 'express';
import { getOfficers } from '../controllers/userController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Endpoint restricted to admins to query list of officers for assignments
router.get('/officers', restrictTo('admin'), getOfficers);

export default router;
