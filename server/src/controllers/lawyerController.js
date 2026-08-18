import Lawyer from '../models/Lawyer.js';
import BlogPost from '../models/BlogPost.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getMyLawyerProfile = asyncHandler(async (req, res) => {
  const profile = await Lawyer.findOne({ user: req.user._id }).populate('user', 'name email phone').populate('services', 'title slug');
  if (!profile) throw new ApiError(404, 'Lawyer profile not found.');
  res.json({ success: true, profile });
});

export const updateMyLawyerProfile = asyncHandler(async (req, res) => {
  const allowed = ['designation', 'experienceYears', 'bio', 'education', 'languages', 'services', 'photoUrl', 'chamberAddress', 'consultationFee'];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
  const profile = await Lawyer.findOneAndUpdate({ user: req.user._id }, updates, { new: true, runValidators: true })
    .populate('user', 'name email phone')
    .populate('services', 'title slug');
  if (!profile) throw new ApiError(404, 'Lawyer profile not found.');
  res.json({ success: true, profile });
});

export const listMyPosts = asyncHandler(async (req, res) => {
  const items = await BlogPost.find({ author: req.user._id }).sort('-createdAt');
  res.json({ success: true, items });
});

export const createMyPost = asyncHandler(async (req, res) => {
  const item = await BlogPost.create({
    title: req.body.title,
    excerpt: req.body.excerpt,
    content: req.body.content,
    category: req.body.category,
    coverUrl: req.body.coverUrl,
    author: req.user._id,
    isPublished: false
  });
  res.status(201).json({ success: true, message: 'Draft created for admin review.', item });
});
