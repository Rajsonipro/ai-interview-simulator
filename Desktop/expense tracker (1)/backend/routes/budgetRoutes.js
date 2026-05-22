import express from 'express';
import { getBudget, createBudget, updateBudget } from '../controllers/budgetController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getBudget)
  .post(protect, createBudget);

router.route('/:id')
  .put(protect, updateBudget);

export default router;
