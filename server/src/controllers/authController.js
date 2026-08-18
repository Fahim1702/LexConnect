import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { publicUser, signToken } from '../utils/auth.js';

function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('lexconnect_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) throw new ApiError(400, 'Name, email, and password are required.');
  if (password.length < 8) throw new ApiError(400, 'Password must contain at least 8 characters.');
  const exists = await User.exists({ email: email.toLowerCase() });
  if (exists) throw new ApiError(409, 'An account with this email already exists.');

  const user = await User.create({ name, email, phone, password, role: 'client' });
  const token = signToken(user._id);
  setAuthCookie(res, token);
  res.status(201).json({ success: true, token, user: publicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required.');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw new ApiError(401, 'Invalid email or password.');
  if (!user.isActive) throw new ApiError(403, 'This account is inactive.');

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  const token = signToken(user._id);
  setAuthCookie(res, token);
  res.json({ success: true, token, user: publicUser(user) });
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('lexconnect_token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
});

export const updateMe = asyncHandler(async (req, res) => {
  const updates = {};
  for (const key of ['name', 'phone']) if (req.body[key] !== undefined) updates[key] = req.body[key];
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, user: publicUser(user) });
});
