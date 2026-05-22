import express from 'express';
import { exportCsv, exportPdf } from '../controllers/exportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/csv', protect, exportCsv);
router.get('/pdf', protect, exportPdf);

export default router;
