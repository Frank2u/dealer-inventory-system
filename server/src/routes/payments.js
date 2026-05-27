import express from 'express';
import { getAllPayments, createPayment, deletePayment } from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAllPayments);
router.post('/', createPayment);
router.delete('/:id', deletePayment);

export default router;
