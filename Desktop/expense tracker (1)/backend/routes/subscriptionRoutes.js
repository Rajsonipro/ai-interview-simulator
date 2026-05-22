import express from 'express';
import {
  getSubscriptions,
  createSubscription,
  deleteSubscription,
} from '../controllers/subscriptionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getSubscriptions).post(protect, createSubscription);
router.route('/:id').delete(protect, deleteSubscription);

export default router;
