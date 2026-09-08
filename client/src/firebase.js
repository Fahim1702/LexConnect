import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Public pages still run while the team's Firebase project is being configured.
export const firebaseAuth = Object.values(config).every(Boolean) ? getAuth(initializeApp(config)) : null;

export function requireFirebaseAuth() {
  if (!firebaseAuth) throw new Error('Sign-in is not available yet. Please try again later.');
  return firebaseAuth;
}
