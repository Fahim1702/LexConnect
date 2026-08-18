import ConsultationRequest from '../models/ConsultationRequest.js';
import Lawyer from '../models/Lawyer.js';
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
  const lawyer = await Lawyer.findOne({ user: req.user._id });
  if (!lawyer) throw new ApiError(404, 'Lawyer profile not found.');
  const items = await ConsultationRequest.find({ assignedLawyer: lawyer._id }).populate(consultationPopulate).sort('-updatedAt');
  res.json({ success: true, items });
});

export const updateLawyerRequest = asyncHandler(async (req, res) => {
  const lawyer = await Lawyer.findOne({ user: req.user._id });
  const item = await ConsultationRequest.findOne({ _id: req.params.id, assignedLawyer: lawyer?._id });
  if (!item) throw new ApiError(404, 'Assigned consultation request not found.');
  const allowed = ['in-review', 'scheduled', 'resolved'];
  if (!allowed.includes(req.body.status)) throw new ApiError(400, `Status must be one of: ${allowed.join(', ')}.`);
  item.status = req.body.status;
  item.lawyerNote = req.body.lawyerNote ?? item.lawyerNote;
  item.statusHistory.push({ status: item.status, changedBy: req.user._id, note: req.body.lawyerNote });
  await item.save();
  res.json({ success: true, item });
});

export const getClientTestimonials = asyncHandler(async (req, res) => {
  const items = await Testimonial.find({ client: req.user._id }).populate('consultation', 'reference subject status').sort('-createdAt');
  res.json({ success: true, items });
});

export const createTestimonial = asyncHandler(async (req, res) => {
  const consultation = await ConsultationRequest.findOne({ _id: req.body.consultation, client: req.user._id, status: 'resolved' });
  if (!consultation) throw new ApiError(400, 'A testimonial can only be submitted for your resolved consultation.');
  const item = await Testimonial.create({
    client: req.user._id,
    consultation: consultation._id,
    lawyer: consultation.assignedLawyer,
    rating: req.body.rating,
    comment: req.body.comment
  });
  res.status(201).json({ success: true, message: 'Testimonial submitted for approval.', item });
});
