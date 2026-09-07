import { activeLawyer, profileUpdates } from '../utils/lawyerProfile.js';
import BlogPost from '../models/BlogPost.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getMyLawyerProfile = asyncHandler(async (req, res) => {
  const profile = await activeLawyer(req.user._id);
  await profile.populate([{ path: 'user', select: 'name email phone' }, { path: 'services', select: 'title slug' }]);
  res.json({ success: true, profile });
});

export const updateMyLawyerProfile = asyncHandler(async (req, res) => {
  const profile = await activeLawyer(req.user._id);
  Object.assign(profile, await profileUpdates(req.body));
  await profile.save();
  await profile.populate([{ path: 'user', select: 'name email phone' }, { path: 'services', select: 'title slug' }]);
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
