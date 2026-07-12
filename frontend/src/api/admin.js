import api from './axios';

/**
 * Admin API calls — analytics, approvals, and platform management.
 * All endpoints require ADMIN role (enforced by API gateway).
 */

export const getOverviewStats = async () => {
  const response = await api.get('/notes/admin/overview');
  return response.data;
};

export const getUploadDownloadStats = async () => {
  const response = await api.get('/notes/admin/upload-download-stats');
  return response.data;
};

export const getTopDownloaded = async () => {
  const response = await api.get('/notes/admin/top-downloaded');
  return response.data;
};

export const getTrendingSubjects = async () => {
  const response = await api.get('/notes/admin/trending-subjects');
  return response.data;
};

export const getPendingApproval = async () => {
  const response = await api.get('/notes/admin/pending-approval');
  return response.data;
};

export const approveNote = async (id) => {
  const response = await api.post(`/notes/admin/approve/${id}`);
  return response.data;
};

export const getNoteRequestStats = async () => {
  const response = await api.get('/notes/admin/note-requests');
  return response.data;
};

export const getUniversityStats = async () => {
  const response = await api.get('/notes/admin/university-stats');
  return response.data;
};

export const getSearchAnalytics = async () => {
  const response = await api.get('/notes/admin/search-analytics');
  return response.data;
};

export const getRecentActivities = async () => {
  const response = await api.get('/notes/admin/recent-activities');
  return response.data;
};

// User admin endpoints
export const getUserOverviewStats = async () => {
  const response = await api.get('/users/admin/overview');
  return response.data;
};

export const getArchivedNotes = async () => {
  const response = await api.get('/notes/admin/archived');
  return response.data;
};

export const archiveNote = async (id) => {
  const response = await api.put(`/notes/admin/${id}/archive`);
  return response.data;
};

export const restoreNote = async (id) => {
  const response = await api.put(`/notes/admin/${id}/restore`);
  return response.data;
};

export const permanentlyDeleteNote = async (id) => {
  const response = await api.delete(`/notes/admin/${id}/permanent`);
  return response.data;
};

export const getUsersByCollege = async () => {
  const response = await api.get('/users/admin/by-college');
  return response.data;
};

export const getRecentUsers = async () => {
  const response = await api.get('/users/admin/recent');
  return response.data;
};



export const updateUserRole = async (id, role) => {
  const response = await api.put(`/users/admin/${id}/role`, { role });
  return response.data;
};
