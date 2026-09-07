import { Router } from 'express';
import { logout, me, syncUser, updateMe } from '../controllers/authController.js';
import { protect, verifyFirebase } from '../middleware/auth.js';

const router = Router();
router.post('/sync', verifyFirebase, syncUser);
router.post('/logout', protect, logout);
router.get('/me', protect, me);
router.patch('/me', protect, updateMe);
export default router;
