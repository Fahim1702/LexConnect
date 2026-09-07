import ConsultationRequest from '../models/ConsultationRequest.js';
import mongoose from 'mongoose';
import { activeLawyer } from '../utils/lawyerProfile.js';
import Testimonial from '../models/Testimonial.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const consultationPopulate = [
  { path: 'client', select: 'name email phone' },
  { path: 'service', select: 'title slug' },
  { path: 'preferredLawyer', populate: { path: 'user', select: 'name' } },
  { path: 'assignedLawyer', populate: { path: 'user', select: 'name email phone' } }
];

export const createConsultation = asyncHandler(async (req, res) => {
  const { service, preferredLawyer, subject, details, preferredDate } = req.body;
  const guestName = req.user?.name || req.body.guestName;
  const guestEmail = req.user?.email || req.body.guestEmail;
  const guestPhone = req.user?.phone || req.body.guestPhone;
  if (!service || !subject || !details || !guestName || !guestEmail || !guestPhone) {
    throw new ApiError(400, 'Name, email, phone, service, subject, and case details are required.');
  }
  const request = await ConsultationRequest.create({
    client: req.user?._id,
    guestName,
    guestEmail,
    guestPhone,
    service,
    preferredLawyer: preferredLawyer || undefined,
    subject,
    details,
    preferredDate: preferredDate || undefined,
    statusHistory: [{ status: 'pending', changedBy: req.user?._id }]
  });
  res.status(201).json({ success: true, message: 'Consultation request submitted.', request });
});

export const getClientRequests = asyncHandler(async (req, res) => {
  const items = await ConsultationRequest.find({ client: req.user._id }).populate(consultationPopulate).sort('-createdAt');
  res.json({ success: true, items });
});

export const cancelClientRequest = asyncHandler(async (req, res) => {
  const item = await ConsultationRequest.findOne({ _id: req.params.id, client: req.user._id });
  if (!item) throw new ApiError(404, 'Consultation request not found.');
  if (item.status !== 'pending') throw new ApiError(400, 'Only pending requests can be cancelled by the client.');
  item.status = 'cancelled';
  item.statusHistory.push({ status: 'cancelled', changedBy: req.user._id, note: 'Cancelled by client' });
  await item.save();
  res.json({ success: true, item });
});

export const getLawyerRequests = asyncHandler(async (req, res) => {
  const lawyer = await activeLawyer(req.user._id);
  const items = await ConsultationRequest.find({ assignedLawyer: lawyer._id }).select('-adminNote -statusHistory').populate(consultationPopulate).sort('-updatedAt');
  res.json({ success: true, items });
});

export const updateLawyerRequest = asyncHandler(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) throw new ApiError(400, 'Invalid consultation ID.');
  const lawyer = await activeLawyer(req.user._id);
  const item = await ConsultationRequest.findOne({ _id: req.params.id, assignedLawyer: lawyer._id });
  if (!item) throw new ApiError(404, 'Assigned consultation request not found.');
  if (['resolved', 'cancelled'].includes(item.status)) throw new ApiError(400, 'Closed consultations cannot be changed by a lawyer.');
  const { status, lawyerNote } = req.body || {};
  const allowed = ['in-review', 'scheduled', 'resolved'];
  if (!allowed.includes(status)) throw new ApiError(400, `Status must be one of: ${allowed.join(', ')}.`);
  if (lawyerNote !== undefined && (typeof lawyerNote !== 'string' || lawyerNote.length > 3000)) throw new ApiError(400, 'Lawyer note must be text of at most 3000 characters.');
  item.status = status;
  if (lawyerNote !== undefined) item.lawyerNote = lawyerNote;
  item.statusHistory.push({ status, changedBy: req.user._id, assignedLawyer: lawyer._id, note: lawyerNote });
  await item.save();
  const visible = item.toObject();
  delete visible.adminNote;
  delete visible.statusHistory;
  res.json({ success: true, item: visible });
});

export const getClientTestimonials = asyncHandler(async (req, res) => {
  const items = await Testimonial.find({ client: req.user._id }).select('-approvedBy').populate('consultation', 'reference subject status').sort('-createdAt');
  res.json({ success: true, items });
});

export const createTestimonial = asyncHandler(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.body?.consultation)) throw new ApiError(400, 'Choose a resolved consultation.');
  if (!Number.isInteger(req.body.rating) || req.body.rating < 1 || req.body.rating > 5) throw new ApiError(400, 'Rating must be a whole number from 1 to 5.');
  if (typeof req.body.comment !== 'string' || !req.body.comment.trim() || req.body.comment.trim().length > 1200) throw new ApiError(400, 'Comment must contain 1 to 1200 characters.');
  const consultation = await ConsultationRequest.findOne({ _id: req.body.consultation, client: req.user._id, status: 'resolved' });
  if (!consultation) throw new ApiError(400, 'A testimonial can only be submitted for your resolved consultation.');
  const item = await Testimonial.create({
    client: req.user._id,
    consultation: consultation._id,
    lawyer: consultation.assignedLawyer,
    rating: req.body.rating,
    comment: req.body.comment.trim()
  });
  res.status(201).json({ success: true, message: 'Testimonial submitted for approval.', item });
});
