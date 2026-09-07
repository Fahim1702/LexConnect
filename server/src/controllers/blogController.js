import mongoose from 'mongoose';
import BlogPost from '../models/BlogPost.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function postFields(body = {}) {
  const fields = ['title', 'excerpt', 'content', 'category', 'coverUrl', 'isFeatured', 'isPublished'];
  for (const key of ['isFeatured', 'isPublished']) {
    if (body[key] !== undefined && typeof body[key] !== 'boolean') throw new ApiError(400, `${key} must be a boolean.`);
  }
  return Object.fromEntries(fields.filter(key => body[key] !== undefined).map(key => [key, body[key]]));
}

async function findPost(id) {
  if (!mongoose.isObjectIdOrHexString(id)) throw new ApiError(400, 'Invalid blog post ID.');
  const item = await BlogPost.findById(id);
  if (!item) throw new ApiError(404, 'Blog post not found.');
  return item;
}

export const listPosts = asyncHandler(async (_req, res) => {
  const items = await BlogPost.find().populate('author', 'name role').sort('-createdAt');
  res.json({ success: true, items });
});

export const createPost = asyncHandler(async (req, res) => {
  const item = await BlogPost.create({ ...postFields(req.body), author: req.user._id });
  await item.populate('author', 'name role');
  res.status(201).json({ success: true, item });
});

export const updatePost = asyncHandler(async (req, res) => {
  const item = await findPost(req.params.id);
  Object.assign(item, postFields(req.body));
  // Document saves run slug/publication hooks and detect concurrent edits.
  await item.save();
  await item.populate('author', 'name role');
  res.json({ success: true, item });
});

export const hidePost = asyncHandler(async (req, res) => {
  const item = await findPost(req.params.id);
  item.isPublished = false;
  await item.save();
  res.json({ success: true, message: 'Post hidden from the public blog.', item });
});
