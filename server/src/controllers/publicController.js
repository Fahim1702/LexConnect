import mongoose from 'mongoose';
import Service from '../models/Service.js';
import Lawyer from '../models/Lawyer.js';
import User from '../models/User.js';
import CaseStudy from '../models/CaseStudy.js';
import BlogPost from '../models/BlogPost.js';
import FAQ from '../models/FAQ.js';
import Testimonial from '../models/Testimonial.js';
import ContactMessage from '../models/ContactMessage.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pageOptions = (req) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
};
const identifierQuery = (value) =>
  mongoose.isValidObjectId(value) ? { $or: [{ _id: value }, { slug: value }] } : { slug: value };

export const getHome = asyncHandler(async (_req, res) => {
  const [services, lawyers, caseStudies, testimonials, lawyerCount, caseCount] = await Promise.all([
    Service.find({ isActive: true }).sort('-isFeatured title').limit(6),
    Lawyer.find({ isActive: true, isFeatured: true }).populate('user', 'name').populate('services', 'title slug').limit(4),
    CaseStudy.find({ isPublished: true, isFeatured: true }).populate('service', 'title slug').limit(3),
    Testimonial.find({ isApproved: true }).select('client rating comment approvedAt').populate('client', 'name').sort('-approvedAt').limit(4),
    Lawyer.countDocuments({ isActive: true }),
    CaseStudy.countDocuments({ isPublished: true })
  ]);
  res.json({ success: true, data: { services, lawyers, caseStudies, testimonials, stats: { lawyerCount, caseCount } } });
});

export const listServices = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageOptions(req);
  const filter = { isActive: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.q) {
    const regex = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ title: regex }, { summary: regex }, { description: regex }];
  }
  const [items, total] = await Promise.all([
    Service.find(filter).sort('-isFeatured title').skip(skip).limit(limit),
    Service.countDocuments(filter)
  ]);
  res.json({ success: true, items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getService = asyncHandler(async (req, res) => {
  const service = await Service.findOne({ ...identifierQuery(req.params.identifier), isActive: true });
  if (!service) throw new ApiError(404, 'Service not found.');
  const [lawyers, caseStudies] = await Promise.all([
    Lawyer.find({ services: service._id, isActive: true }).populate('user', 'name').populate('services', 'title slug'),
    CaseStudy.find({ service: service._id, isPublished: true }).populate('lawyers', 'slug designation')
  ]);
  res.json({ success: true, service, lawyers, caseStudies });
});

export const listLawyers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageOptions(req);
  const filter = { isActive: true };
  if (req.query.service) filter.services = req.query.service;
  if (req.query.minExperience) filter.experienceYears = { $gte: Number(req.query.minExperience) || 0 };
  if (req.query.q) {
    const regex = new RegExp(escapeRegex(req.query.q), 'i');
    const users = await User.find({ name: regex }).distinct('_id');
    filter.$or = [{ user: { $in: users } }, { designation: regex }, { bio: regex }];
  }
  const [items, total] = await Promise.all([
    Lawyer.find(filter).populate('user', 'name').populate('services', 'title slug').sort('-isFeatured -experienceYears').skip(skip).limit(limit),
    Lawyer.countDocuments(filter)
  ]);
  res.json({ success: true, items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getLawyer = asyncHandler(async (req, res) => {
  const lawyer = await Lawyer.findOne({ ...identifierQuery(req.params.identifier), isActive: true })
    .populate('user', 'name email phone')
    .populate('services', 'title slug summary');
  if (!lawyer) throw new ApiError(404, 'Lawyer not found.');
  const caseStudies = await CaseStudy.find({ lawyers: lawyer._id, isPublished: true }).populate('service', 'title slug');
  res.json({ success: true, lawyer, caseStudies });
});

export const listCaseStudies = asyncHandler(async (req, res) => {
  const filter = { isPublished: true };
  if (req.query.service) filter.service = req.query.service;
  const items = await CaseStudy.find(filter).populate('service', 'title slug').populate({ path: 'lawyers', populate: { path: 'user', select: 'name' } }).sort('-publishedAt');
  res.json({ success: true, items });
});

export const getCaseStudy = asyncHandler(async (req, res) => {
  const item = await CaseStudy.findOne({ ...identifierQuery(req.params.identifier), isPublished: true })
    .populate('service', 'title slug')
    .populate({ path: 'lawyers', populate: { path: 'user', select: 'name' } });
  if (!item) throw new ApiError(404, 'Case study not found.');
  res.json({ success: true, item });
});

export const listBlogPosts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageOptions(req);
  const filter = { isPublished: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.q) {
    const regex = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ title: regex }, { excerpt: regex }];
  }
  const [items, total] = await Promise.all([
    BlogPost.find(filter).populate('author', 'name role').sort('-publishedAt').skip(skip).limit(limit),
    BlogPost.countDocuments(filter)
  ]);
  res.json({ success: true, items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getBlogPost = asyncHandler(async (req, res) => {
  const item = await BlogPost.findOne({ ...identifierQuery(req.params.identifier), isPublished: true }).populate('author', 'name role');
  if (!item) throw new ApiError(404, 'Blog post not found.');
  res.json({ success: true, item });
});

export const listFAQs = asyncHandler(async (_req, res) => {
  const items = await FAQ.find({ isActive: true }).sort('category sortOrder createdAt');
  res.json({ success: true, items });
});

export const createContactMessage = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body || {};
  if (!name || !email || !subject || !message) throw new ApiError(400, 'Name, email, subject, and message are required.');
  const item = await ContactMessage.create({ name, email, phone, subject, message });
  res.status(201).json({ success: true, message: 'Your message has been received.', id: item._id });
});
