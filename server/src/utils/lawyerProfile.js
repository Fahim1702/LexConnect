import mongoose from 'mongoose';
import Service from '../models/Service.js';
import Lawyer from '../models/Lawyer.js';
import ApiError from './ApiError.js';

export async function profileUpdates(body = {}, admin = false) {
  const allowed = ['designation', 'experienceYears', 'bio', 'education', 'languages', 'services', 'photoUrl', 'chamberAddress', 'consultationFee'];
  if (admin) allowed.push('barCouncilNumber', 'isFeatured', 'isActive');
  const updates = Object.fromEntries(allowed.filter(key => body[key] !== undefined).map(key => [key, body[key]]));
  if (updates.services !== undefined) {
    if (!Array.isArray(updates.services) || updates.services.some(id => !mongoose.isObjectIdOrHexString(id))) {
      throw new ApiError(400, 'Services must be a list of service IDs.');
    }
    updates.services = [...new Set(updates.services.map(String))];
    const count = await Service.countDocuments({ _id: { $in: updates.services }, isActive: true });
    if (count !== updates.services.length) throw new ApiError(400, 'Choose existing active services.');
  }
  return updates;
}

export async function activeLawyer(user) {
  const lawyer = await Lawyer.findOne({ user });
  if (!lawyer) throw new ApiError(404, 'Lawyer profile not found.');
  if (!lawyer.isActive) throw new ApiError(403, 'Lawyer profile is archived. Contact an administrator.');
  return lawyer;
}
