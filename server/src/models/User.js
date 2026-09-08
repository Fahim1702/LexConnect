import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, sparse: true },
    name: { type: String, required: [true, 'Name is required.'], trim: true, maxlength: 80 },
    email: { type: String, required: [true, 'Email is required.'], unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, maxlength: 24 },
    // Legacy hashes remain hidden until old development records are migrated.
    // New accounts authenticate with Firebase and never store passwords here.
    password: { type: String, select: false },
    role: { type: String, enum: ['admin', 'client', 'lawyer'], default: 'client' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date
  },
  { timestamps: true }
);

userSchema.pre('validate', function rejectLocalPassword() {
  if (this.isModified('password')) this.invalidate('password', 'Passwords are managed by Firebase Authentication.');
});

export default mongoose.model('User', userSchema);
