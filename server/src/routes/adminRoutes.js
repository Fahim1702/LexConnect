import { Router } from 'express';
import { archiveConsultation, getOverview, listConsultations, listLawyers, updateConsultation } from '../controllers/adminController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();
router.use(protect, authorize('admin'));
router.get('/overview', getOverview);
router.get('/lawyers', listLawyers);
router.get('/consultations', listConsultations);
router.route('/consultations/:id').patch(updateConsultation).delete(archiveConsultation);
export default router;
