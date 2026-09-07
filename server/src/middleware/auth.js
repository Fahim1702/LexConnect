import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { firebaseIdentity } from '../config/firebase.js';

async function verifyIdentity(req) {
  const header = req.headers.authorization;
  if (typeof header !== 'string' || !/^Bearer [^\s]+$/.test(header)) {
    throw new ApiError(401, 'A Firebase bearer token is required.');
  }
  try {
    const identity = await firebaseIdentity.verifyIdToken(header.slice(7));
    if (!identity.uid || typeof identity.email !== 'string') {
      throw new ApiError(401, 'Sign in using an account with an email address.');
    }
    return identity;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.code === 'auth/user-disabled') throw new ApiError(403, 'This account is inactive.');
    if (['auth/argument-error', 'auth/invalid-id-token', 'auth/id-token-expired', 'auth/id-token-revoked', 'auth/user-not-found'].includes(error.code)) {
      throw new ApiError(401, 'Your session is invalid or has expired. Please sign in again.');
    }
    throw new ApiError(503, 'Authentication is temporarily unavailable.');
  }
}

export const verifyFirebase = asyncHandler(async (req, _res, next) => {
  req.firebaseUser = await verifyIdentity(req);
  next();
});

async function loadUser(req) {
  req.firebaseUser = await verifyIdentity(req);
  const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
  if (!user) throw new ApiError(401, 'Complete sign-in before accessing your account.');
  if (!user.isActive) throw new ApiError(403, 'This account is inactive.');
  req.user = user;
}

export const protect = asyncHandler(async (req, _res, next) => {
  await loadUser(req);
  next();
});

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  // No token means guest. An invalid supplied token must not bypass account checks.
  if (req.headers.authorization !== undefined) await loadUser(req);
  next();
});

export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action.'));
  }
  next();
};
