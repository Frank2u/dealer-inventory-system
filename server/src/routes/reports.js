import express from 'express';
import { getDashboardStats, getReports } from '../controllers/reportController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/dashboard-stats', getDashboardStats);
router.get('/', getReports);

export default router;
