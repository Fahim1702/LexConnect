import User from '../models/User.js';
import Lawyer from '../models/Lawyer.js';
import Service from '../models/Service.js';
import ConsultationRequest from '../models/ConsultationRequest.js';
import Testimonial from '../models/Testimonial.js';
import ContactMessage from '../models/ContactMessage.js';
import { adminResources } from '../config/adminResources.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function resourceFor(name) {
  const resource = adminResources[name];
  if (!resource) throw new ApiError(404, 'Admin resource not found.');
  return resource;
}

export const getOverview = asyncHandler(async (_req, res) => {
  const [users, lawyers, services, pending, unreadMessages, pendingTestimonials, recent] = await Promise.all([
    User.countDocuments(), Lawyer.countDocuments({ isActive: true }), Service.countDocuments({ isActive: true }),
    ConsultationRequest.countDocuments({ status: 'pending' }), ContactMessage.countDocuments({ status: 'new' }),
    Testimonial.countDocuments({ isApproved: false }),
    ConsultationRequest.find().populate('service', 'title').populate('assignedLawyer').sort('-createdAt').limit(6)
  ]);
  res.json({ success: true, stats: { users, lawyers, services, pending, unreadMessages, pendingTestimonials }, recent });
});

export const listResource = asyncHandler(async (req, res) => {
  const resource = resourceFor(req.params.resource);
  const items = await resource.model.find().populate(resource.populate).sort(resource.sort);
  res.json({ success: true, items });
});

export const getResource = asyncHandler(async (req, res) => {
  const resource = resourceFor(req.params.resource);
  const item = await resource.model.findById(req.params.id).populate(resource.populate);
  if (!item) throw new ApiError(404, 'Record not found.');
  res.json({ success: true, item });
});

export const createResource = asyncHandler(async (req, res) => {
  const resource = resourceFor(req.params.resource);
  const payload = { ...req.body };
  if (req.params.resource === 'blog' && !payload.author) payload.author = req.user._id;
  const item = await resource.model.create(payload);
  res.status(201).json({ success: true, item });
});

export const updateResource = asyncHandler(async (req, res) => {
  const resource = resourceFor(req.params.resource);
  const payload = { ...req.body };
  if (['case-studies', 'blog'].includes(req.params.resource) && payload.isPublished && !payload.publishedAt) {
    payload.publishedAt = new Date();
  }
  const item = await resource.model.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }).populate(resource.populate);
  if (!item) throw new ApiError(404, 'Record not found.');
  res.json({ success: true, item });
});

export const deleteResource = asyncHandler(async (req, res) => {
  const resource = resourceFor(req.params.resource);
  const item = await resource.model.findByIdAndUpdate(req.params.id, resource.softDelete, { new: true });
  if (!item) throw new ApiError(404, 'Record not found.');
  res.json({ success: true, message: 'Record archived.', item });
});

export const listLawyers = asyncHandler(async (_req, res) => {
  const items = await Lawyer.find().populate('user', 'name email phone isActive').populate('services', 'title');
  res.json({ success: true, items });
});

export const createLawyer = asyncHandler(async (req, res) => {
  const { name, email, phone, password, ...profile } = req.body;
  if (!name || !email || !password) throw new ApiError(400, 'Name, email, and a temporary password are required.');
  const user = await User.create({ name, email, phone, password, role: 'lawyer' });
  try {
    const lawyer = await Lawyer.create({ ...profile, user: user._id });
    const populated = await lawyer.populate([{ path: 'user', select: 'name email phone isActive' }, { path: 'services', select: 'title' }]);
    res.status(201).json({ success: true, item: populated });
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    throw error;
  }
});

export const updateLawyer = asyncHandler(async (req, res) => {
  const profileUpdates = { ...req.body };
  const userUpdates = {};
  for (const key of ['name', 'email', 'phone']) {
    if (profileUpdates[key] !== undefined) {
      userUpdates[key] = profileUpdates[key];
      delete profileUpdates[key];
    }
  }
  delete profileUpdates.password;
  const lawyer = await Lawyer.findById(req.params.id);
  if (!lawyer) throw new ApiError(404, 'Lawyer not found.');
  if (Object.keys(userUpdates).length) await User.findByIdAndUpdate(lawyer.user, userUpdates, { runValidators: true });
  Object.assign(lawyer, profileUpdates);
  await lawyer.save();
  await lawyer.populate([{ path: 'user', select: 'name email phone isActive' }, { path: 'services', select: 'title' }]);
  res.json({ success: true, item: lawyer });
});

export const archiveLawyer = asyncHandler(async (req, res) => {
  const lawyer = await Lawyer.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!lawyer) throw new ApiError(404, 'Lawyer not found.');
  await User.findByIdAndUpdate(lawyer.user, { isActive: false });
  res.json({ success: true, message: 'Lawyer archived.', item: lawyer });
});

export const listConsultations = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const items = await ConsultationRequest.find(filter)
    .populate('client', 'name email phone').populate('service', 'title')
    .populate({ path: 'preferredLawyer', populate: { path: 'user', select: 'name' } })
    .populate({ path: 'assignedLawyer', populate: { path: 'user', select: 'name' } }).sort('-createdAt');
  res.json({ success: true, items });
});

export const updateConsultation = asyncHandler(async (req, res) => {
  const item = await ConsultationRequest.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Consultation request not found.');
  if (req.body.assignedLawyer !== undefined) item.assignedLawyer = req.body.assignedLawyer || undefined;
  if (req.body.status) item.status = req.body.status;
  else if (req.body.assignedLawyer && item.status === 'pending') item.status = 'assigned';
  if (req.body.adminNote !== undefined) item.adminNote = req.body.adminNote;
  item.statusHistory.push({ status: item.status, changedBy: req.user._id, note: req.body.adminNote });
  await item.save();
  res.json({ success: true, item });
});

export const archiveConsultation = asyncHandler(async (req, res) => {
  const item = await ConsultationRequest.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
  if (!item) throw new ApiError(404, 'Consultation request not found.');
  res.json({ success: true, message: 'Consultation cancelled.', item });
});

export const listUsers = asyncHandler(async (_req, res) => {
  const items = await User.find().sort('-createdAt');
  res.json({ success: true, items });
});

export const updateUser = asyncHandler(async (req, res) => {
  const updates = {};
  for (const key of ['name', 'phone', 'role', 'isActive']) if (req.body[key] !== undefined) updates[key] = req.body[key];
  const item = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!item) throw new ApiError(404, 'User not found.');
  res.json({ success: true, item });
});

export const listTestimonials = asyncHandler(async (_req, res) => {
  const items = await Testimonial.find().populate('client', 'name email').populate('consultation', 'reference subject').sort('-createdAt');
  res.json({ success: true, items });
});

export const reviewTestimonial = asyncHandler(async (req, res) => {
  const isApproved = Boolean(req.body.isApproved);
  const item = await Testimonial.findByIdAndUpdate(req.params.id, {
    isApproved,
    approvedBy: isApproved ? req.user._id : undefined,
    approvedAt: isApproved ? new Date() : undefined
  }, { new: true });
  if (!item) throw new ApiError(404, 'Testimonial not found.');
  res.json({ success: true, item });
});
