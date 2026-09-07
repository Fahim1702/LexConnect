import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { publicUser } from '../utils/auth.js';
import { firebaseIdentity } from '../config/firebase.js';

export const syncUser = asyncHandler(async (req, res) => {
  const identity = req.firebaseUser;
  const { name, phone } = req.body || {};
  let user = await User.findOne({ firebaseUid: identity.uid });

  if (!user) {
    try {
      user = await User.create({
        firebaseUid: identity.uid,
        email: identity.email,
        name: name ?? identity.name ?? identity.email.split('@')[0],
        phone,
        role: 'client'
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      // A concurrent sign-in may have created this UID. Never link by email alone.
      user = await User.findOne({ firebaseUid: identity.uid });
      if (!user) throw new ApiError(409, 'This email belongs to an existing account. Contact the administrator to migrate it.');
    }
  }
  if (!user.isActive) throw new ApiError(403, 'This account is inactive.');
  const updates = { lastLoginAt: new Date() };
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  user = await User.findByIdAndUpdate(user._id, { $set: updates }, { new: true, runValidators: true });
  res.json({ success: true, user: publicUser(user) });
});

export const logout = asyncHandler(async (req, res) => {
  await firebaseIdentity.revokeRefreshTokens(req.user.firebaseUid);
  res.json({ success: true, message: 'Signed out. Existing sessions have been revoked.' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
});

export const updateMe = asyncHandler(async (req, res) => {
  const updates = {};
  for (const key of ['name', 'phone']) if (req.body?.[key] !== undefined) updates[key] = req.body[key];
  const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
  res.json({ success: true, user: publicUser(user) });
});
