import express from 'express';
import {
  checkDuplicate,
  createIssue,
  getAllIssues,
  getIssue,
  updateIssueStatus,
  assignIssue,
  toggleUpvote,
  getAdminAnalytics,
} from '../controllers/issueController.js';
import {
  getIssueComments,
  createComment,
} from '../controllers/commentController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';
import { validate, createIssueSchema } from '../middlewares/validationMiddleware.js';

const router = express.Router();

// Apply auth protection to all routes below
router.use(protect);

router.post('/check-duplicate', checkDuplicate);

// Multer runs first to parse multipart data, then Zod validates text body
router.post('/', upload.single('image'), validate(createIssueSchema), createIssue);

router.get('/', getAllIssues);

// Mount analytics ABOVE wildcard :id path to prevent routing clashes
router.get('/analytics', restrictTo('admin'), getAdminAnalytics);

router.get('/:id', getIssue);

// Upvotes and comments sub-routing
router.post('/:id/upvote', toggleUpvote);
router.get('/:id/comments', getIssueComments);
router.post('/:id/comments', createComment);

// Route-gates for management
router.patch('/:id/status', restrictTo('officer', 'admin'), upload.single('image'), updateIssueStatus);
router.patch('/:id/assign', restrictTo('admin'), assignIssue);

export default router;
