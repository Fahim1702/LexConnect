import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 300 },
    answer: { type: String, required: true, maxlength: 3000 },
    category: { type: String, required: true, trim: true, index: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true, optimisticConcurrency: true }
);

export default mongoose.model('FAQ', faqSchema);
