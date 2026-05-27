import express from 'express';
import { getAllShops, getShopById, createShop, updateShop, deleteShop, getShopHistory } from '../controllers/shopController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAllShops);
router.get('/:id', getShopById);
router.post('/', createShop);
router.put('/:id', updateShop);
router.delete('/:id', deleteShop);
router.get('/:id/history', getShopHistory);

export default router;
