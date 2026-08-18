import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function readToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return req.cookies?.lexconnect_token;
}

async function resolveUser(req) {
  const token = readToken(req);
  if (!token) return null;
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  return User.findById(payload.sub);
}

export const protect = asyncHandler(async (req, _res, next) => {
  const user = await resolveUser(req);
  if (!user) throw new ApiError(401, 'Authentication is required.');
  if (!user.isActive) throw new ApiError(403, 'This account is inactive.');
  req.user = user;
  next();
});

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  try {
    const user = await resolveUser(req);
    if (user?.isActive) req.user = user;
  } catch {
    // Public endpoints continue as a guest when an old token is supplied.
  }
  next();
});

export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action.'));
  }
  next();
};
