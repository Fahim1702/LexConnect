import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('lexconnect_token')) {
      setLoading(false);
      return;
    }
    api.get('/auth/me').then(({ data }) => setUser(data.user)).catch(() => localStorage.removeItem('lexconnect_token')).finally(() => setLoading(false));
  }, []);

  const authenticate = async (endpoint, payload) => {
    const { data } = await api.post(endpoint, payload);
    localStorage.setItem('lexconnect_token', data.token);
    setUser(data.user);
    return data.user;
  };
  const login = (payload) => authenticate('/auth/login', payload);
  const register = (payload) => authenticate('/auth/register', payload);
  const logout = async () => {
    try { await api.post('/auth/logout'); } finally {
      localStorage.removeItem('lexconnect_token');
      setUser(null);
    }
  };
  const updateProfile = async (payload) => {
    const { data } = await api.patch('/auth/me', payload);
    setUser(data.user);
    return data.user;
  };
  const value = useMemo(() => ({ user, loading, login, register, logout, updateProfile }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
