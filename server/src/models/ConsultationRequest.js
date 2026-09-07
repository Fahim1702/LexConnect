import mongoose from 'mongoose';

const consultationRequestSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // A readable reference based on MongoDB's automatically generated _id.
    reference: {
      type: String,
      unique: true,
      default: function () {
        return `LC-${this._id.toString().toUpperCase()}`;
      }
    },
    guestName: {
      type: String,
      required: true,
      trim: true
    },
    guestEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    guestPhone: {
      type: String,
      required: true,
      trim: true
    },
    // Stores the _id of the legal service selected by the client.
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180
    },
    details: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },
    preferredDate: {
      type: Date
    },
    preferredLawyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lawyer'
    },
    assignedLawyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer' },
    adminNote: { type: String, maxlength: 3000 },
    statusHistory: [{
      _id: false,
      status: { type: String, required: true },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      assignedLawyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer' },
      note: String,
      changedAt: { type: Date, default: Date.now }
    }],
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in-review', 'scheduled', 'resolved', 'cancelled'],
      default: 'pending'
    }
  },
  // Mongoose adds createdAt and updatedAt when documents are saved.
  { timestamps: true, optimisticConcurrency: true }
);

const ConsultationRequest = mongoose.model('ConsultationRequest', consultationRequestSchema);

export default ConsultationRequest;
