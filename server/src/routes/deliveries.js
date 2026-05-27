import express from 'express';
import { getAllDeliveries, getDeliveryById, createDelivery, deleteDelivery } from '../controllers/deliveryController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAllDeliveries);
router.get('/:id', getDeliveryById);
router.post('/', createDelivery);
router.delete('/:id', deleteDelivery);

export default router;
