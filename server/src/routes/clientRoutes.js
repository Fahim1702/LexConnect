import { Router } from 'express';
import {
  cancelClientRequest, createTestimonial, getClientRequests, getClientTestimonials
} from '../controllers/consultationController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();
router.use(protect, authorize('client'));
router.get('/consultations', getClientRequests);
router.patch('/consultations/:id/cancel', cancelClientRequest);
router.get('/testimonials', getClientTestimonials);
router.post('/testimonials', createTestimonial);
export default router;
