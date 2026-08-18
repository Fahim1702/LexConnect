import { Router } from 'express';
import {
  archiveConsultation, archiveLawyer, createLawyer, createResource, deleteResource, getOverview,
  getResource, listConsultations, listLawyers, listResource, listTestimonials, listUsers,
  reviewTestimonial, updateConsultation, updateLawyer, updateResource, updateUser
} from '../controllers/adminController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();
router.use(protect, authorize('admin'));
router.get('/overview', getOverview);
router.route('/lawyers').get(listLawyers).post(createLawyer);
router.route('/lawyers/:id').patch(updateLawyer).delete(archiveLawyer);
router.get('/consultations', listConsultations);
router.route('/consultations/:id').patch(updateConsultation).delete(archiveConsultation);
router.get('/users', listUsers);
router.patch('/users/:id', updateUser);
router.get('/testimonials', listTestimonials);
router.patch('/testimonials/:id', reviewTestimonial);
router.route('/content/:resource').get(listResource).post(createResource);
router.route('/content/:resource/:id').get(getResource).patch(updateResource).delete(deleteResource);
export default router;
