import api from './axios';

/**
 * College API calls — search, count, and admin management.
 */

/** Search colleges by query (autocomplete). Public endpoint — no auth required. */
export const searchColleges = async (query) => {
  const response = await api.get('/users/colleges/search', { params: { q: query } });
  return response.data;
};

/** Get accurate college count from the colleges collection. */
export const getCollegesCount = async () => {
  const response = await api.get('/users/colleges/count');
  return response.data;
};

// ── Admin Endpoints ──

/** Get all colleges (admin only). */
export const getAllColleges = async () => {
  const response = await api.get('/users/admin/colleges');
  return response.data;
};

/** Get pending colleges (admin only). */
export const getPendingColleges = async () => {
  const response = await api.get('/users/admin/colleges/pending');
  return response.data;
};

/** Approve a pending college (admin only). */
export const approveCollege = async (id) => {
  const response = await api.put(`/users/admin/colleges/${id}/approve`);
  return response.data;
};

/** Update college details (admin only). */
export const updateCollege = async (id, data) => {
  const response = await api.put(`/users/admin/colleges/${id}`, data);
  return response.data;
};

/** Merge duplicate college into target (admin only). */
export const mergeColleges = async (targetId, duplicateId) => {
  const response = await api.post(`/users/admin/colleges/${targetId}/merge`, { duplicateId });
  return response.data;
};

/** Trigger one-time data migration (admin only). */
export const triggerCollegeMigration = async () => {
  const response = await api.post('/users/admin/colleges/migrate');
  return response.data;
};
