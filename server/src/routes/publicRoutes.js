import { Router } from 'express';
import {
  createContactMessage, getBlogPost, getCaseStudy, getHome, getLawyer, getService,
  listBlogPosts, listCaseStudies, listFAQs, listLawyers, listServices
} from '../controllers/publicController.js';

const router = Router();
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
