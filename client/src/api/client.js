import axios from 'axios';
import { firebaseAuth } from '../firebase.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(async (config) => {
  if (firebaseAuth) await firebaseAuth.authStateReady();
  // Firebase refreshes expired ID tokens; never store a separate JWT manually.
  const token = await firebaseAuth?.currentUser?.getIdToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const failure = new Error(error.response?.data?.message || error.message || 'Request failed.');
    failure.status = error.response?.status;
    return Promise.reject(failure);
  }
);

export default api;
