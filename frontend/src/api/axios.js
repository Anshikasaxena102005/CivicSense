import axios from 'axios';

/**
 * Pre-configured Axios instance.
 * baseURL points to /api — Vite proxy forwards to http://localhost:5000/api
 * so no CORS issues during local development.
 */
const API = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request Interceptor ───────────────────────────────────────
// Attach JWT token from localStorage to every request automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('civicsense_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ──────────────────────────────────────
// • Returns response.data so callers get the payload directly
// • On 401: clears auth state and redirects to /login
API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('civicsense_token');
      localStorage.removeItem('civicsense_user');
      // Only redirect if not already on an auth page
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    // Reject with server error shape so components can read .message
    return Promise.reject(
      error.response?.data || { message: error.message || 'Network error' }
    );
  }
);

export default API;
