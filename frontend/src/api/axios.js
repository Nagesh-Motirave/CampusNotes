import axios from 'axios';

// IMPORTANT: Vite replaces import.meta.env.VITE_API_URL at BUILD TIME, not runtime.
// The fallback URL below is used if VITE_API_URL is not set during the build.
// For local development, set VITE_API_URL in frontend/.env
// For Vercel, set VITE_API_URL in the Vercel dashboard Environment Variables.
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://api-service-5pjw.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ── Request Interceptor ─────────────────────────────────────────────────
// Attaches the JWT token (if present) to every outgoing request.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ────────────────────────────────────────────────
// On 401 Unauthorized, clear stale auth data and redirect to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Avoid redirect loop if already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;