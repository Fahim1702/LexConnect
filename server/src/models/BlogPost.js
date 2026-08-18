import mongoose from 'mongoose';
import { slugify } from '../utils/slugify.js';

const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    excerpt: { type: String, required: true, maxlength: 300 },
    content: { type: String, required: true, maxlength: 30000 },
    category: { type: String, required: true, trim: true },
    coverUrl: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    publishedAt: Date
  },
  { timestamps: true }
);

blogPostSchema.pre('validate', function createSlug(next) {
  if (this.isModified('title') || !this.slug) this.slug = slugify(this.title);
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) this.publishedAt = new Date();
  next();
});

export default mongoose.model('BlogPost', blogPostSchema);
