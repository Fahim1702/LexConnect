import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required.'], trim: true, maxlength: 80 },
    email: { type: String, required: [true, 'Email is required.'], unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, maxlength: 24 },
    password: { type: String, required: [true, 'Password is required.'], minlength: 8, select: false },
    role: { type: String, enum: ['admin', 'client', 'lawyer'], default: 'client' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
