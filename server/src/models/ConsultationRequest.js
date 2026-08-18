import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: String,
    changedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const consultationRequestSchema = new mongoose.Schema(
  {
    reference: { type: String, unique: true, index: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    guestName: { type: String, required: true, trim: true },
    guestEmail: { type: String, required: true, lowercase: true, trim: true },
    guestPhone: { type: String, required: true, trim: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    preferredLawyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer' },
    assignedLawyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer' },
    subject: { type: String, required: true, trim: true, maxlength: 180 },
    details: { type: String, required: true, maxlength: 5000 },
    preferredDate: Date,
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in-review', 'scheduled', 'resolved', 'cancelled'],
      default: 'pending',
      index: true
    },
    adminNote: String,
    lawyerNote: String,
    statusHistory: [statusHistorySchema]
  },
  { timestamps: true }
);

consultationRequestSchema.pre('validate', function createReference(next) {
  if (!this.reference) {
    const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
    this.reference = `LC-${Date.now().toString(36).toUpperCase()}-${suffix}`;
  }
  next();
});

export default mongoose.model('ConsultationRequest', consultationRequestSchema);
