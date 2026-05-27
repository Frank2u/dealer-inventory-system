import express from 'express';
import { getAllStockEntries, createStockEntry, deleteStockEntry } from '../controllers/stockController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAllStockEntries);
router.post('/', createStockEntry);
router.delete('/:id', deleteStockEntry);

export default router;
