import api from './axios';

/**
 * Authentication API calls.
 */

/** Register a new user */
export const registerUser = async (data) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

/** Login and receive JWT token */
export const loginUser = async (data) => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

/** Request a password reset link */
export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};
