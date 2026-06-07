import express from 'express';
import { getAllAreas, createArea, updateArea, deleteArea } from '../controllers/areaController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAllAreas);
router.post('/', createArea);
router.put('/:id', updateArea);
router.delete('/:id', deleteArea);

export default router;
