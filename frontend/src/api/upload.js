import api from './axios';

/**
 * File upload API call — sends file to Cloudinary via file-upload-service.
 * Uses multipart/form-data with progress tracking.
 */

/** Upload a file (PDF/image) and return { fileUrl, publicId, fileType } */
export const uploadFile = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });

  return response.data;
};
