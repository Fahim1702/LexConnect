import { Router } from 'express';
import ApiError from '../utils/ApiError.js';
import {
  createContactMessage, getBlogPost, getCaseStudy, getHome, getLawyer, getService,
  listBlogPosts, listCaseStudies, listFAQs, listLawyers, listServices
} from '../controllers/publicController.js';

const router = Router();
router.use((req, _res, next) => {
  for (const value of Object.values(req.query)) {
    if (typeof value !== 'string') return next(new ApiError(400, 'Supply each query parameter only once.'));
  }
  for (const key of ['page', 'limit']) {
    if (req.query[key] !== undefined && (!Number.isSafeInteger(Number(req.query[key])) || Number(req.query[key]) < 1)) {
      return next(new ApiError(400, `${key} must be a positive whole number.`));
    }
  }
  if (req.query.minExperience !== undefined && (!Number.isFinite(Number(req.query.minExperience)) || Number(req.query.minExperience) < 0)) {
    return next(new ApiError(400, 'Minimum experience must be a non-negative number.'));
  }
  next();
});
router.get('/home', getHome);
router.get('/services', listServices);
router.get('/services/:identifier', getService);
router.get('/lawyers', listLawyers);
router.get('/lawyers/:identifier', getLawyer);
router.get('/case-studies', listCaseStudies);
router.get('/case-studies/:identifier', getCaseStudy);
router.get('/blog', listBlogPosts);
router.get('/blog/:identifier', getBlogPost);
router.get('/faqs', listFAQs);
router.post('/contact', createContactMessage);
export default router;
