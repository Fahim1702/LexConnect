import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import { postFields } from './blogController.js';
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
  Object.assign(profile, await profileUpdates(req.body, false, profile.services));
  await profile.save();
  await profile.populate([{ path: 'user', select: 'name email phone' }, { path: 'services', select: 'title slug' }]);
  res.json({ success: true, profile });
});

export const listMyPosts = asyncHandler(async (req, res) => {
  await activeLawyer(req.user._id);
  const items = await BlogPost.find({ author: req.user._id }).sort('-createdAt');
  res.json({ success: true, items });
});

export const createMyPost = asyncHandler(async (req, res) => {
  await activeLawyer(req.user._id);
  const item = await BlogPost.create({
    title: req.body.title,
    excerpt: req.body.excerpt,
    content: req.body.content,
    category: req.body.category,
    coverUrl: req.body.coverUrl,
    author: req.user._id,
    isPublished: false
  });
  res.status(201).json({ success: true, message: 'Draft saved. You can edit and publish it from your blog page.', item });
});

async function ownedPost(req) {
  await activeLawyer(req.user._id);
  if (!mongoose.isObjectIdOrHexString(req.params.id)) throw new ApiError(400, 'Invalid blog post ID.');
  const item = await BlogPost.findOne({ _id: req.params.id, author: req.user._id });
  if (!item) throw new ApiError(404, 'Blog post not found.');
  return item;
}

export const updateMyPost = asyncHandler(async (req, res) => {
  const item = await ownedPost(req);
  const updates = postFields(req.body);
  delete updates.isFeatured;
  Object.assign(item, updates);
  await item.save();
  res.json({ success: true, item });
});

export const hideMyPost = asyncHandler(async (req, res) => {
  const item = await ownedPost(req);
  item.isPublished = false;
  await item.save();
  res.json({ success: true, message: 'Post hidden.', item });
});
