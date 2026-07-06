import api from './axios';

/**
 * Notes API calls — CRUD, search, like, download, requests.
 */

/** Get all notes with optional filters and pagination */
export const getNotes = async (params = {}) => {
  const response = await api.get('/notes', { params });
  return response.data;
};

/** Get distinct values for a field */
export const getDistinctValues = async (field, params = {}) => {
  const response = await api.get('/notes/distinct', { params: { field, ...params } });
  return response.data;
};

/** Get a single note by ID */
export const getNoteById = async (id) => {
  const response = await api.get(`/notes/${id}`);
  return response.data;
};

/** Upload note metadata (after file is uploaded to Cloudinary) */
export const uploadNote = async (data) => {
  const response = await api.post('/notes/upload', data);
  return response.data;
};

/** Toggle like on a note */
export const toggleLike = async (id) => {
  const response = await api.post(`/notes/${id}/like`);
  return response.data;
};

/** Record a download for a note */
export const recordDownload = async (id) => {
  const response = await api.post(`/notes/${id}/download`);
  return response.data;
};

/** Search notes by query string */
export const searchNotes = async (query, params = {}) => {
  const response = await api.get('/notes/search', { params: { q: query, ...params } });
  return response.data;
};

/** Get top rated / most downloaded notes */
export const getTopNotes = async () => {
  const response = await api.get('/notes/top');
  return response.data;
};

/** Get open note requests */
export const getNoteRequests = async () => {
  const response = await api.get('/notes/requests');
  return response.data;
};

/** Create a note request */
export const createNoteRequest = async (data) => {
  const response = await api.post('/notes/requests', data);
  return response.data;
};

/** Fulfill a note request */
export const fulfillNoteRequest = async (id) => {
  const response = await api.put(`/notes/requests/${id}/fulfill`);
  return response.data;
};

/** Delete a note (owner only) */
export const deleteNote = async (id) => {
  const response = await api.delete(`/notes/${id}`);
  return response.data;
};

export const getStats = async () => {
  const response = await api.get('/notes/stats');
  return response.data;
};

// --- Reviews & Reports ---

export const getNoteReviews = async (noteId) => {
  const response = await api.get(`/notes/${noteId}/reviews`);
  return response.data;
};

export const addNoteReview = async (noteId, data) => {
  const response = await api.post(`/notes/${noteId}/reviews`, data);
  return response.data;
};

export const reportNote = async (noteId, reason) => {
  const response = await api.post(`/notes/${noteId}/report`, { reason });
  return response.data;
};
