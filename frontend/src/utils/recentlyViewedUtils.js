/**
 * recentlyViewedUtils.js
 * Helper functions to manage recently viewed notes in localStorage
 */

const STORAGE_KEY = 'recentlyViewedNotes';
const MAX_ITEMS = 5;

export const getRecentlyViewed = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const addRecentlyViewed = (note) => {
  if (!note || !note.id) return;
  
  try {
    let recent = getRecentlyViewed();
    // Remove if already exists to move it to the front
    recent = recent.filter(n => n.id !== note.id);
    // Add to front
    recent.unshift({
      id: note.id,
      title: note.title,
      subject: note.subject,
      college: note.college,
      timestamp: new Date().getTime()
    });
    // Keep only top MAX_ITEMS
    if (recent.length > MAX_ITEMS) {
      recent = recent.slice(0, MAX_ITEMS);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
  } catch (e) {
    console.error('Failed to save recently viewed note', e);
  }
};
