import mongoose from 'mongoose';
import { slugify } from '../utils/slugify.js';

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, unique: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    summary: { type: String, required: true, maxlength: 240 },
    description: { type: String, required: true, maxlength: 5000 },
    icon: { type: String, default: 'Scale' },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

serviceSchema.pre('validate', function createSlug(next) {
  if (this.isModified('title') || !this.slug) this.slug = slugify(this.title);
  next();
});

export default mongoose.model('Service', serviceSchema);
