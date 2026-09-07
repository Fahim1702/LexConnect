import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import api from '../api/client.js';
import { firebaseAuth, requireFirebaseAuth } from '../firebase.js';

const AuthContext = createContext(null);

function authError(error) {
  const messages = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/email-already-in-use': 'An account with this email already exists. Please sign in.',
    'auth/weak-password': 'Choose a stronger password with at least 8 characters.',
    'auth/user-disabled': 'This account is inactive.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Could not connect. Check your connection and try again.',
    'auth/operation-not-allowed': 'Email sign-in is not available yet.'
  };
  return new Error(messages[error.code] || (error.code?.startsWith('auth/') ? 'Unable to sign in. Please try again.' : error.message));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const actionInProgress = useRef(false);
  const revision = useRef(0);

  useEffect(() => {
    // Remove tokens from the previous custom-auth implementation.
    localStorage.removeItem('lexconnect_token');
    if (!firebaseAuth) { setLoading(false); return; }
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (account) => {
      if (actionInProgress.current) return;
      const current = ++revision.current;
      setLoading(true);
      try {
        const profile = account ? (await api.post('/auth/sync')).data.user : null;
        if (current === revision.current) setUser(profile);
      } catch {
        if (current === revision.current) {
          setUser(null);
          await signOut(firebaseAuth);
        }
      } finally {
        if (current === revision.current) setLoading(false);
      }
    });
    return () => { revision.current += 1; unsubscribe(); };
  }, []);

  const authenticate = async (payload, creating) => {
    const auth = requireFirebaseAuth();
    actionInProgress.current = true;
    revision.current += 1;
    setLoading(true);
    try {
      const email = payload.email.trim();
      if (creating) {
        if (!payload.name.trim()) throw new Error('Enter your full name.');
        if (payload.name.trim().length > 80) throw new Error('Your name must be at most 80 characters.');
        if ((payload.phone || '').trim().length > 24) throw new Error('Your phone number must be at most 24 characters.');
        if (payload.password.length < 8) throw new Error('Use at least 8 characters for your password.');
      }
      const credential = creating
        ? await createUserWithEmailAndPassword(auth, email, payload.password)
        : await signInWithEmailAndPassword(auth, email, payload.password);
      if (creating) await updateFirebaseProfile(credential.user, { displayName: payload.name.trim() });
      const profile = creating ? { name: payload.name.trim(), phone: (payload.phone || '').trim() } : {};
      const { data } = await api.post('/auth/sync', profile);
      setUser(data.user);
      return data.user;
    } catch (error) {
      setUser(null);
      await signOut(auth);
      throw authError(error);
    } finally {
      actionInProgress.current = false;
      setLoading(false);
    }
  };

  const login = payload => authenticate(payload, false);
  const register = payload => authenticate(payload, true);
  const logout = async () => {
    revision.current += 1;
    try {
      if (firebaseAuth?.currentUser) await api.post('/auth/logout');
    } catch {
      // Local sign-out must still work when the API is unreachable.
    } finally {
      if (firebaseAuth) await signOut(firebaseAuth);
      setUser(null);
    }
  };
  const updateProfile = async (payload) => {
    const { data } = await api.patch('/auth/me', payload);
    setUser(data.user);
    return data.user;
  };
  return <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
