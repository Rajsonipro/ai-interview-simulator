import express from 'express';
import { getForecast } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/forecast', protect, getForecast);

export default router;
