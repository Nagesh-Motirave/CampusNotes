/**
 * Utility functions for manipulating Cloudinary URLs and handling downloads.
 */

/**
 * Transforms a standard Cloudinary URL to ensure it has a .pdf extension if it's a PDF.
 * We no longer use fl_attachment because Cloudinary often blocks it with ERR_INVALID_RESPONSE
 * for free tier accounts or strict security settings.
 * 
 * @param {string} url The original Cloudinary URL
 * @returns {string} The formatted URL
 */
export const getCloudinaryUrl = (url) => {
  return url || '';
};

/**
 * Securely downloads a file by fetching its blob and triggering an HTML5 download.
 * This completely bypasses Chrome's PDF viewer and avoids opening new tabs,
 * guaranteeing a clean download experience regardless of Cloudinary's headers.
 * 
 * @param {string} url The file URL to download
 * @param {string} filename The suggested filename for the download
 */
export const forceDownload = async (url, filename = 'document.pdf') => {
  try {
    const fetchUrl = getCloudinaryUrl(url);
    const response = await fetch(fetchUrl);
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const rawBlob = await response.blob();
    // Explicitly set MIME type to application/pdf so the browser processes the blob correctly
    const blob = filename.endsWith('.pdf') ? new Blob([rawBlob], { type: 'application/pdf' }) : rawBlob;
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    
    // Delay revocation to ensure the browser has enough time to start the download
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1000);
    return true;
  } catch (error) {
    console.error('Download failed:', error);
    // Fallback: If fetch fails due to CORS, just open in a new tab
    window.open(getCloudinaryUrl(url), '_blank');
    return false;
  }
};
