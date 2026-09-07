import mongoose from 'mongoose';
import { slugify } from '../utils/slugify.js';

const lawyerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    slug: { type: String, unique: true, index: true },
    designation: { type: String, required: true, trim: true },
    barCouncilNumber: { type: String, required: true, unique: true, trim: true },
    experienceYears: { type: Number, min: 0, max: 70, default: 0 },
    bio: { type: String, required: true, maxlength: 3000 },
    education: [{ type: String, trim: true }],
    languages: [{ type: String, trim: true }],
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
    photoUrl: String,
    chamberAddress: String,
    consultationFee: { type: Number, min: 0, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true, optimisticConcurrency: true }
);

lawyerSchema.pre('validate', async function createSlug(next) {
  if (!this.slug && this.user && this.barCouncilNumber) {
    const User = mongoose.model('User');
    const user = await User.findById(this.user).select('name');
    if (user) this.slug = `${slugify(user.name)}-${this.barCouncilNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  }
  next();
});

export default mongoose.model('Lawyer', lawyerSchema);
