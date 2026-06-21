import express from 'express';
import { login, getProfile, customerLogin } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/customer/login', customerLogin);
router.get('/profile', authMiddleware, getProfile);

export default router;
