import { Router } from 'express';
import { createConsultation } from '../controllers/consultationController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();
router.post('/', optionalAuth, createConsultation);
export default router;
