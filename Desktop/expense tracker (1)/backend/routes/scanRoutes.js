import express from 'express';
import { scanReceipt } from '../controllers/scanController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, scanReceipt);

export default router;
