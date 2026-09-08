import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    consultation: { type: mongoose.Schema.Types.ObjectId, ref: 'ConsultationRequest', required: true, unique: true },
    lawyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer' },
    rating: { type: Number, required: true, min: 1, max: 5, validate: { validator: Number.isInteger, message: 'Rating must be a whole number.' } },
    comment: { type: String, required: true, trim: true, maxlength: 1200 },
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date
  },
  { timestamps: true, optimisticConcurrency: true }
);

export default mongoose.model('Testimonial', testimonialSchema);
