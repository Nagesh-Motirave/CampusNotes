/**
 * achievementUtils.js
 * Calculates gamification elements based on user statistics.
 */

export const LEVELS = [
  { name: 'Bronze', minPoints: 0, color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200' },
  { name: 'Silver', minPoints: 100, color: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-200' },
  { name: 'Gold', minPoints: 500, color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200' },
  { name: 'Platinum', minPoints: 1000, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
  { name: 'Campus Legend', minPoints: 2500, color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200' },
];

/**
 * Get the contributor level object based on points.
 */
export const getContributorLevel = (points = 0) => {
  let currentLevel = LEVELS[0];
  for (const level of LEVELS) {
    if (points >= level.minPoints) {
      currentLevel = level;
    }
  }
  return currentLevel;
};

/**
 * Calculate Global Rank.
 * For now, this is a simulated rank based on points, 
 * in a real app, this would be computed by the DB (COUNT(id) where points > user.points).
 */
export const calculateGlobalRank = (points = 0) => {
  if (points === 0) return 'Unranked';
  
  // Simulated ranking logic (higher points = lower numerical rank)
  // e.g. 10000 base students, points help you climb
  let rank = 10000 - (points * 15);
  if (rank < 1) rank = 1;
  return `#${Math.floor(rank)}`;
};

/**
 * Calculate Contribution Score (0-100)
 * Evaluates impact based on ratio of likes + downloads to uploads
 */
export const calculateContributionScore = (uploads = 0, likes = 0, downloads = 0) => {
  if (uploads === 0) return 0;
  
  const score = ((likes * 2 + downloads) / (uploads * 10)) * 100;
  return Math.min(Math.round(score), 100);
};

/**
 * Calculate earned badges based on upload history and profile stats.
 * @param {Array} uploadHistory - List of note objects uploaded by user
 * @param {Object} stats - Profile stats object {notesUploaded, totalLikes, totalDownloads}
 */
export const calculateBadges = (uploadHistory = [], stats = {}) => {
  const badges = [];

  // General Top Uploader
  if (stats.notesUploaded >= 10) {
    badges.push({ id: 'top-uploader', name: 'Top Uploader', icon: '🏆', color: 'text-yellow-600', bg: 'bg-yellow-50' });
  }

  // General Most Loved
  if (stats.totalLikes >= 50) {
    badges.push({ id: 'most-loved', name: 'Highly Appreciated', icon: '❤️', color: 'text-red-500', bg: 'bg-red-50' });
  }

  // Subject Matter Experts
  const subjectCounts = {};
  uploadHistory.forEach(note => {
    if (note.subject) {
      subjectCounts[note.subject] = (subjectCounts[note.subject] || 0) + 1;
    }
  });

  Object.entries(subjectCounts).forEach(([subject, count]) => {
    if (count >= 3) {
      badges.push({ 
        id: `expert-${subject.toLowerCase()}`, 
        name: `${subject} Expert`, 
        icon: '🎓', 
        color: 'text-blue-600', 
        bg: 'bg-blue-50' 
      });
    }
  });
  
  // Return at least a default badge if empty
  if (badges.length === 0) {
    badges.push({ id: 'novice', name: 'Novice Contributor', icon: '🌱', color: 'text-green-600', bg: 'bg-green-50' });
  }

  return badges;
};

/** Generate initials from user name */
export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};
