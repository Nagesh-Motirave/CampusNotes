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

export default api;