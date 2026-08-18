import Service from '../models/Service.js';
import CaseStudy from '../models/CaseStudy.js';
import BlogPost from '../models/BlogPost.js';
import FAQ from '../models/FAQ.js';

export const adminResources = {
  services: { model: Service, populate: [], sort: '-createdAt', softDelete: { isActive: false } },
  'case-studies': { model: CaseStudy, populate: ['service', 'lawyers'], sort: '-createdAt', softDelete: { isPublished: false } },
  blog: { model: BlogPost, populate: [{ path: 'author', select: 'name role' }], sort: '-createdAt', softDelete: { isPublished: false } },
  faqs: { model: FAQ, populate: [], sort: 'category sortOrder', softDelete: { isActive: false } }
};
