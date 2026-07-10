import api from './axios';

/**
 * User API calls — profile, leaderboard.
 */

/** Get user profile by ID */
export const getUserProfile = async (id) => {
  const response = await api.get(`/users/${id}/profile`);
  return response.data;
};

/** Update user profile */
export const updateUserProfile = async (id, data) => {
  const response = await api.put(`/users/${id}/profile`, data);
  return response.data;
};

export const getLeaderboard = async () => {
  const response = await api.get('/users/leaderboard');
  return response.data;
};

export const getStudentsCount = async () => {
  const response = await api.get('/users/count');
  return response.data;
};

export const getCollegesCount = async () => {
  const response = await api.get('/users/colleges/count');
  return response.data;
};

// --- Notifications ---

export const getNotifications = async (userId) => {
  const response = await api.get(`/users/${userId}/notifications`);
  return response.data;
};

export const markNotificationsRead = async (userId) => {
  const response = await api.put(`/users/${userId}/notifications/read`);
  return response.data;
};

// --- Study Progress ---

export const getStudyProgress = async (userId) => {
  const response = await api.get(`/users/${userId}/progress`);
  return response.data;
};

export const toggleStudyProgress = async (userId, noteId) => {
  const response = await api.post(`/users/${userId}/progress/${noteId}`);
  return response.data;
};
