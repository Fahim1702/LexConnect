import mongoose from 'mongoose';
import { slugify } from '../utils/slugify.js';

const caseStudySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    summary: { type: String, required: true, maxlength: 300 },
    challenge: { type: String, required: true, maxlength: 5000 },
    approach: { type: String, required: true, maxlength: 5000 },
    outcome: { type: String, required: true, maxlength: 5000 },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    lawyers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer' }],
    imageUrl: String,
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    publishedAt: Date
  },
  { timestamps: true }
);

caseStudySchema.pre('validate', function createSlug(next) {
  if (this.isModified('title') || !this.slug) this.slug = slugify(this.title);
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) this.publishedAt = new Date();
  next();
});

export default mongoose.model('CaseStudy', caseStudySchema);
