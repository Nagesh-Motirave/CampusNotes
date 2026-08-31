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

/** Request a password reset OTP */
export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

/** Verify OTP */
export const verifyOtp = async (data) => {
  const response = await api.post('/auth/verify-reset-otp', data);
  return response.data;
};

/** Reset password using OTP */
export const resetPassword = async (data) => {
  const response = await api.post('/auth/reset-password', data);
  return response.data;
};

// ─── Registration OTP ───────────────────────────────────────────────

/** Step 1: Send registration OTP to verify email */
export const sendRegistrationOtp = async (data) => {
  const response = await api.post('/auth/register/send-otp', data);
  return response.data;
};

/** Step 2: Verify registration OTP and complete account creation */
export const verifyRegistrationOtp = async (data) => {
  const response = await api.post('/auth/register/verify-otp', data);
  return response.data;
};
