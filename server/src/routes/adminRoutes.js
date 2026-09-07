import { Router } from 'express';
import { listPosts, createPost, updatePost, hidePost } from '../controllers/blogController.js';
import { archiveLawyer, createLawyer, updateLawyer, listLawyerCandidates, archiveConsultation, getOverview, listConsultations, listLawyers, updateConsultation } from '../controllers/adminController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();
router.use(protect, authorize('admin'));
router.get('/overview', getOverview);
router.get('/lawyer-candidates', listLawyerCandidates);
router.route('/lawyers').get(listLawyers).post(createLawyer);
router.route('/lawyers/:id').patch(updateLawyer).delete(archiveLawyer);
router.get('/consultations', listConsultations);
router.route('/consultations/:id').patch(updateConsultation).delete(archiveConsultation);
router.route('/content/blog').get(listPosts).post(createPost);
router.route('/content/blog/:id').patch(updatePost).delete(hidePost);
export default router;
