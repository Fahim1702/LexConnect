import { Router } from 'express';
import { getLawyerRequests, updateLawyerRequest } from '../controllers/consultationController.js';
import { listMyPosts, createMyPost, getMyLawyerProfile, updateMyLawyerProfile } from '../controllers/lawyerController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();
router.use(protect, authorize('lawyer'));
router.get('/profile', getMyLawyerProfile);
router.patch('/profile', updateMyLawyerProfile);
router.get('/consultations', getLawyerRequests);
router.patch('/consultations/:id', updateLawyerRequest);
router.route('/blog').get(listMyPosts).post(createMyPost);
export default router;
