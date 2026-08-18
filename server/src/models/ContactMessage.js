import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: String,
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, maxlength: 5000 },
    status: { type: String, enum: ['new', 'read', 'replied', 'archived'], default: 'new' }
  },
  { timestamps: true }
);

export default mongoose.model('ContactMessage', contactMessageSchema);
