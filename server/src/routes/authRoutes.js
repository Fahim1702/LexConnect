import { Router } from 'express';
import { login, logout, me, register, updateMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, me);
router.patch('/me', protect, updateMe);
export default router;
