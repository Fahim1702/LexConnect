import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import './env.js';
import ApiError from '../utils/ApiError.js';

function firebaseAuth() {
  if (!process.env.FIREBASE_PROJECT_ID) {
    throw new ApiError(503, 'Authentication is not configured on the server yet.');
  }
  const app = getApps().find(item => item.name === 'lexconnect-auth') || initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
    credential: applicationDefault()
  }, 'lexconnect-auth');
  return getAuth(app);
}

// Credentials come from GOOGLE_APPLICATION_CREDENTIALS or the hosting environment.
// checkRevoked=true also rejects revoked sessions and disabled Firebase accounts.
export const firebaseIdentity = {
  verifyIdToken: token => firebaseAuth().verifyIdToken(token, true),
  revokeRefreshTokens: uid => firebaseAuth().revokeRefreshTokens(uid)
};
