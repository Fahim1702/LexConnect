import { Router } from 'express';
import { getLawyerRequests, updateLawyerRequest } from '../controllers/consultationController.js';
import { createMyPost, getMyLawyerProfile, listMyPosts, updateMyLawyerProfile } from '../controllers/lawyerController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();
router.use(protect, authorize('lawyer'));
router.get('/profile', getMyLawyerProfile);
router.patch('/profile', updateMyLawyerProfile);
router.get('/consultations', getLawyerRequests);
router.patch('/consultations/:id', updateLawyerRequest);
router.get('/blog', listMyPosts);
router.post('/blog', createMyPost);
export default router;
