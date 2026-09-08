import mongoose from 'mongoose';
import { profileUpdates } from '../utils/lawyerProfile.js';
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
  if (!['services', 'case-studies', 'faqs'].includes(name) || !resource) throw new ApiError(404, 'Admin resource not found.');
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

const contentFields = {
  services: ['title', 'category', 'description', 'summary', 'icon', 'isFeatured', 'isActive'],
  'case-studies': ['title', 'service', 'lawyers', 'summary', 'challenge', 'approach', 'outcome', 'imageUrl', 'isFeatured', 'isPublished'],
  faqs: ['question', 'answer', 'category', 'sortOrder', 'isActive']
};

async function contentPayload(req) {
  const body = req.body || {};
  const payload = Object.fromEntries(contentFields[req.params.resource].filter(key => body[key] !== undefined).map(key => [key, body[key]]));
  for (const key of ['isActive', 'isFeatured', 'isPublished']) {
    if (payload[key] !== undefined && typeof payload[key] !== 'boolean') throw new ApiError(400, `${key} must be true or false.`);
  }
  if (payload.service !== undefined && (!mongoose.isObjectIdOrHexString(payload.service) || !await Service.exists({ _id: payload.service }))) {
    throw new ApiError(400, 'Choose an existing service.');
  }
  if (payload.lawyers !== undefined) {
    if (!Array.isArray(payload.lawyers) || payload.lawyers.some(id => !mongoose.isObjectIdOrHexString(id))) throw new ApiError(400, 'Choose valid lawyer profiles.');
    payload.lawyers = [...new Set(payload.lawyers)];
    if (await Lawyer.countDocuments({ _id: { $in: payload.lawyers } }) !== payload.lawyers.length) throw new ApiError(400, 'Choose existing lawyer profiles.');
  }
  return payload;
}

export const createResource = asyncHandler(async (req, res) => {
  const resource = resourceFor(req.params.resource);
  const item = await resource.model.create(await contentPayload(req));
  await item.populate(resource.populate);
  res.status(201).json({ success: true, item });
});

export const updateResource = asyncHandler(async (req, res) => {
  const resource = resourceFor(req.params.resource);
  const item = await resource.model.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Record not found.');
  Object.assign(item, await contentPayload(req));
  await item.save();
  await item.populate(resource.populate);
  res.json({ success: true, item });
});

export const deleteResource = asyncHandler(async (req, res) => {
  const resource = resourceFor(req.params.resource);
  const item = await resource.model.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Record not found.');
  Object.assign(item, resource.softDelete);
  await item.save();
  res.json({ success: true, message: 'Record archived.', item });
});

export const listLawyers = asyncHandler(async (req, res) => {
  const eligible = req.query.eligible === 'true';
  const lawyers = await Lawyer.find(eligible ? { isActive: true } : {}).populate('user', 'name email phone isActive role firebaseUid').populate('services', 'title');
  const items = eligible ? lawyers.filter(lawyer => lawyer.user?.isActive && lawyer.user.role === 'lawyer' && lawyer.user.firebaseUid) : lawyers;
  res.json({ success: true, items });
});

export const listLawyerCandidates = asyncHandler(async (_req, res) => {
  const linked = await Lawyer.distinct('user');
  const items = await User.find({ _id: { $nin: linked }, isActive: true, role: { $in: ['client', 'lawyer'] }, firebaseUid: { $type: 'string', $ne: '' } })
    .select('name email').sort('name');
  res.json({ success: true, items });
});

export const createLawyer = asyncHandler(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.body?.user)) throw new ApiError(400, 'Choose a registered account.');
  const user = await User.findById(req.body.user);
  if (!user?.isActive || !user.firebaseUid || !['client', 'lawyer'].includes(user.role)) {
    throw new ApiError(400, 'Choose an active Firebase-linked client or lawyer account.');
  }
  if (await Lawyer.exists({ user: user._id })) throw new ApiError(409, 'This account already has a lawyer profile.');
  // Validate and create the profile before granting the role. Works on standalone MongoDB too.
  const lawyer = await Lawyer.create({ ...await profileUpdates(req.body, true), user: user._id });
  try {
    const promoted = await User.findOneAndUpdate({ _id: user._id, role: user.role, isActive: true, firebaseUid: user.firebaseUid }, { $set: { role: 'lawyer' } });
    if (!promoted) throw new ApiError(409, 'The account changed. Refresh and try again.');
  } catch (error) {
    await Lawyer.deleteOne({ _id: lawyer._id });
    throw error;
  }
  await lawyer.populate([{ path: 'user', select: 'name email phone isActive' }, { path: 'services', select: 'title' }]);
  res.status(201).json({ success: true, item: lawyer });
});

export const updateLawyer = asyncHandler(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) throw new ApiError(400, 'Invalid lawyer ID.');
  const lawyer = await Lawyer.findById(req.params.id);
  if (!lawyer) throw new ApiError(404, 'Lawyer not found.');
  Object.assign(lawyer, await profileUpdates(req.body, true, lawyer.services));
  await lawyer.save();
  await lawyer.populate([{ path: 'user', select: 'name email phone isActive' }, { path: 'services', select: 'title' }]);
  res.json({ success: true, item: lawyer });
});

export const archiveLawyer = asyncHandler(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) throw new ApiError(400, 'Invalid lawyer ID.');
  const lawyer = await Lawyer.findById(req.params.id);
  if (!lawyer) throw new ApiError(404, 'Lawyer not found.');
  lawyer.isActive = false;
  await lawyer.save();
  res.json({ success: true, message: 'Lawyer profile archived. Existing consultations are retained.', item: lawyer });
});

export const listConsultations = asyncHandler(async (req, res) => {
  if (req.query.status !== undefined && !ConsultationRequest.schema.path('status').enumValues.includes(req.query.status)) {
    throw new ApiError(400, 'Invalid consultation status filter.');
  }
  const filter = req.query.status ? { status: req.query.status } : {};
  const items = await ConsultationRequest.find(filter)
    .populate('client', 'name email phone').populate('service', 'title')
    .populate({ path: 'preferredLawyer', populate: { path: 'user', select: 'name' } })
    .populate({ path: 'assignedLawyer', populate: { path: 'user', select: 'name' } }).sort('-createdAt');
  res.json({ success: true, items });
});

export const updateConsultation = asyncHandler(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) throw new ApiError(400, 'Invalid consultation ID');
  const { assignedLawyer, status, adminNote } = req.body || {};
  if (assignedLawyer === undefined && status === undefined && adminNote === undefined) {
    throw new ApiError(400, 'Supply an assigned lawyer, status, or admin note.');
  }
  if (status !== undefined && !ConsultationRequest.schema.path('status').enumValues.includes(status)) {
    throw new ApiError(400, 'Invalid consultation status.');
  }
  if (adminNote !== undefined && (typeof adminNote !== 'string' || adminNote.length > 3000)) {
    throw new ApiError(400, 'Admin note must be text of at most 3000 characters.');
  }
  const item = await ConsultationRequest.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Consultation request not found.');
  if (assignedLawyer !== undefined) {
    if (assignedLawyer === '' || assignedLawyer === null) {
      item.assignedLawyer = undefined;
      if (item.status === 'assigned' && status === undefined) item.status = 'pending';
    } else {
      if (!mongoose.isObjectIdOrHexString(assignedLawyer)) throw new ApiError(400, 'Invalid assigned lawyer ID');
      const lawyer = await Lawyer.findById(assignedLawyer).populate('user', 'role isActive firebaseUid');
      if (!lawyer?.isActive || !lawyer.user?.isActive || lawyer.user.role !== 'lawyer' || !lawyer.user.firebaseUid) {
        throw new ApiError(400, 'Choose an active lawyer with an active lawyer account.');
      }
      item.assignedLawyer = lawyer._id;
      if (item.status === 'pending' && status === undefined) item.status = 'assigned';
    }
  }
  if (status !== undefined) item.status = status;
  if (item.status === 'assigned' && !item.assignedLawyer) throw new ApiError(400, 'Select a lawyer before marking the request assigned.');
  if (adminNote !== undefined) item.adminNote = adminNote;
  item.statusHistory.push({ status: item.status, changedBy: req.user._id, assignedLawyer: item.assignedLawyer, note: adminNote });
  await item.save();
  await item.populate([{ path: 'service', select: 'title category' }, { path: 'assignedLawyer', populate: { path: 'user', select: 'name' } }]);
  res.json({ success: true, item });
});

export const archiveConsultation = asyncHandler(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) throw new ApiError(400, 'Invalid consultation ID');
  const item = await ConsultationRequest.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Consultation request not found.');
  if (item.status !== 'cancelled') {
    item.status = 'cancelled';
    item.statusHistory.push({ status: 'cancelled', changedBy: req.user._id, assignedLawyer: item.assignedLawyer });
    await item.save();
  }
  res.json({ success: true, message: 'Consultation cancelled.', item });
});

export const listUsers = asyncHandler(async (_req, res) => {
  const items = await User.find().select('name email phone role isActive createdAt').sort('-createdAt');
  res.json({ success: true, items });
});

export const updateUser = asyncHandler(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) throw new ApiError(400, 'Invalid user ID.');
  if (typeof req.body?.isActive !== 'boolean') throw new ApiError(400, 'Activation must be true or false.');
  // Administrators are managed by a trusted maintainer, preventing accidental lockout.
  const item = await User.findOneAndUpdate({ _id: req.params.id, role: { $ne: 'admin' } }, { $set: { isActive: req.body.isActive } }, { new: true, runValidators: true })
    .select('name email phone role isActive createdAt');
  if (!item) {
    if (await User.exists({ _id: req.params.id })) throw new ApiError(400, 'Administrator accounts cannot be deactivated here.');
    throw new ApiError(404, 'User not found.');
  }
  res.json({ success: true, item });
});

export const listMessages = asyncHandler(async (_req, res) => {
  const items = await ContactMessage.find().sort('-createdAt');
  res.json({ success: true, items });
});

export const updateMessage = asyncHandler(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) throw new ApiError(400, 'Invalid message ID.');
  if (!ContactMessage.schema.path('status').enumValues.includes(req.body?.status)) throw new ApiError(400, 'Choose a valid message status.');
  const item = await ContactMessage.findByIdAndUpdate(req.params.id, { $set: { status: req.body.status } }, { new: true, runValidators: true });
  if (!item) throw new ApiError(404, 'Message not found.');
  res.json({ success: true, item });
});

export const listTestimonials = asyncHandler(async (_req, res) => {
  const items = await Testimonial.find().populate('client', 'name email').populate('consultation', 'reference subject').sort('-createdAt');
  res.json({ success: true, items });
});

export const reviewTestimonial = asyncHandler(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) throw new ApiError(400, 'Invalid testimonial ID.');
  if (typeof req.body?.isApproved !== 'boolean') throw new ApiError(400, 'Approval must be true or false.');
  const item = await Testimonial.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Testimonial not found.');
  item.isApproved = req.body.isApproved;
  item.approvedBy = item.isApproved ? req.user._id : undefined;
  item.approvedAt = item.isApproved ? new Date() : undefined;
  await item.save();
  res.json({ success: true, item });
});
