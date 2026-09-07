import { Router } from 'express';
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
export default router;
