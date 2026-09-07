import { Router } from 'express';
import mongoose from 'mongoose';
import ConsultationRequest from '../models/ConsultationRequest.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

const router = Router();
router.use(protect, authorize('client'));

router.get('/consultations', asyncHandler(async (req, res) => {
  const items = await ConsultationRequest.find({ client: req.user._id })
    .populate('service', 'title').sort('-createdAt');
  res.json({ success: true, items });
}));

router.patch('/consultations/:id/cancel', asyncHandler(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) throw new ApiError(400, 'Invalid consultation ID');
  // Ownership and pending status are checked in the same database update.
  const item = await ConsultationRequest.findOneAndUpdate(
    { _id: req.params.id, client: req.user._id, status: 'pending' },
    { $set: { status: 'cancelled' } },
    { new: true, runValidators: true }
  );
  if (!item) {
    const owned = await ConsultationRequest.exists({ _id: req.params.id, client: req.user._id });
    if (!owned) throw new ApiError(404, 'Consultation request not found');
    throw new ApiError(400, 'Only pending requests can be cancelled.');
  }
  res.json({ success: true, item });
}));

export default router;
