import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../api/users';
import { getNotes } from '../api/notes';
import Leaderboard from '../components/Leaderboard';
import { ProfileSkeleton } from '../components/LoadingSkeleton';
import { getContributorLevel, calculateGlobalRank, calculateContributionScore, calculateBadges } from '../utils/achievementUtils';
import NoteCard from '../components/NoteCard';

const Profile = () => {
  const { user, isAdmin } = useAuth();
  const [profile, setProfile] = useState(null);
  
  // New States for History and Favorites
  const [uploadHistory, setUploadHistory] = useState([]);
  const [favoriteNotes, setFavoriteNotes] = useState([]);
  const [activeTab, setActiveTab] = useState('uploads'); // 'uploads', 'favorites', 'activity'
  
  const [loading, setLoading] = useState(true);

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', college: '' });
  const [isSaving, setIsSaving] = useState(false);

  const handleEditClick = () => {
    setEditForm({ name: profile?.name || user?.name || '', college: profile?.college || user?.college || '' });
    setIsEditing(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await updateUserProfile(user.id, editForm);
      await fetchProfileData();
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile', err);
      alert(`Error updating profile: ${err.response?.data?.message || err.message}. Did you restart the backend user-service?`);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      // Fetch user stats, uploads, and favorites in parallel
      const [profileData, uploadsData, favoritesData] = await Promise.all([
        getUserProfile(user.id),
        getNotes({ uploaderId: user.id, size: 20 }),
        getNotes({ likedByUserId: user.id, size: 20 })
      ]);
      
      setProfile(profileData);
      setUploadHistory(uploadsData.content || []);
      setFavoriteNotes(favoritesData.content || []);
    } catch (err) {
      console.error('Failed to fetch profile data', err);
    } finally {
      setLoading(false);
    }
  };

  /** Determine admin status from all available sources */
  const showAdmin = isAdmin
    || user?.role?.toUpperCase() === 'ADMIN'
    || profile?.role?.toUpperCase() === 'ADMIN';

  /** Generate initials from user name */
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <ProfileSkeleton />
      </div>
    );
  }

  // --- Calculations ---
  const level = getContributorLevel(profile?.points || 0);
  const rank = calculateGlobalRank(profile?.points || 0);
  const contributionScore = calculateContributionScore(
    profile?.stats?.notesUploaded || 0,
    profile?.stats?.totalLikes || 0,
    profile?.stats?.totalDownloads || 0
  );
  
  const totalViews = (profile?.stats?.totalDownloads || 0) * 3 + (profile?.stats?.totalLikes || 0) * 2; // Simulated views
  
  const badges = calculateBadges(uploadHistory, profile?.stats || {});

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      
      {/* 1. HERO SECTION */}
      <div className={`relative overflow-hidden rounded-3xl p-1 bg-gradient-to-r from-primary-500 via-purple-500 to-primary-600 shadow-xl`}>
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
          <svg className="w-64 h-64 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
        </div>
        
        <div className="glass-card bg-white/95 backdrop-blur-md rounded-[22px] p-8 relative z-10 flex flex-col md:flex-row items-center gap-8">
          
          <div className="relative">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold shadow-xl border-4 ${level.border} ${level.bg} ${level.color}`}>
              {getInitials(profile?.name || user?.name)}
            </div>
            <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg border bg-white ${level.color} ${level.border} whitespace-nowrap`}>
              {level.name}
            </div>
          </div>

          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">{profile?.name || user?.name}</h1>
            <p className="text-gray-500 font-medium mb-4">@{profile?.email?.split('@')[0] || user?.email?.split('@')[0]}</p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span className="badge badge-blue flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                {profile?.college || user?.college}
              </span>
              
              <button 
                onClick={handleEditClick}
                className="badge bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-1 cursor-pointer">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Edit Profile
              </button>

              {showAdmin && (
                <Link to="/admin" className="badge bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors shadow-sm">
                  Admin Dashboard
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex gap-4 text-center">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 min-w-[120px] border border-purple-200 shadow-sm">
              <p className="text-4xl font-black text-purple-800">{profile?.points || 0}</p>
              <p className="text-xs font-bold text-purple-500 uppercase tracking-wide mt-1">Total Points</p>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 min-w-[120px] border border-gray-200 shadow-sm">
              <p className="text-4xl font-black text-gray-800">{rank}</p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-1">Global Rank</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STATS & BADGES GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Statistics Board */}
        <div className="lg:col-span-7 glass-card p-6 border-t-4 border-t-primary-500">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Impact Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
              <p className="text-2xl font-bold text-gray-900">{profile?.stats?.notesUploaded || 0}</p>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1">Uploads</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
              <p className="text-2xl font-bold text-green-600">{profile?.stats?.totalDownloads || 0}</p>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1">Downloads</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
              <p className="text-2xl font-bold text-purple-600">{totalViews}</p>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1">Total Views</p>
            </div>
            <div className="bg-primary-50 rounded-xl p-4 text-center border border-primary-100 relative overflow-hidden">
              <div className="absolute inset-0 bg-primary-100 opacity-20 w-full" style={{ height: `${100 - contributionScore}%` }}></div>
              <p className="text-2xl font-bold text-primary-700 relative z-10">{contributionScore}</p>
              <p className="text-[10px] text-primary-600 uppercase font-bold tracking-wider mt-1 relative z-10">Score</p>
            </div>
          </div>
        </div>

        {/* Badges Case */}
        <div className="lg:col-span-5 glass-card p-6 border-t-4 border-t-yellow-400">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.58l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" /></svg>
            Achievements
          </h2>
          <div className="flex flex-wrap gap-3">
            {badges.map((badge, idx) => (
              <div key={idx} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${badge.bg} ${badge.color} border-current/20 shadow-sm`}>
                <span className="text-xl">{badge.icon}</span>
                <span className="text-xs font-bold tracking-wide">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. TABS SECTION */}
      <div className="glass-card overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('uploads')}
            className={`px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'uploads' ? 'border-primary-500 text-primary-600 bg-primary-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            Upload History ({uploadHistory.length})
          </button>
          <button 
            onClick={() => setActiveTab('favorites')}
            className={`px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'favorites' ? 'border-primary-500 text-primary-600 bg-primary-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            Favorite Notes ({favoriteNotes.length})
          </button>
          <button 
            onClick={() => setActiveTab('activity')}
            className={`px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'activity' ? 'border-primary-500 text-primary-600 bg-primary-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            Points Activity
          </button>
        </div>

        <div className="p-6 bg-gray-50/30">
          
          {/* UPLOADS TAB */}
          {activeTab === 'uploads' && (
            uploadHistory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {uploadHistory.map(note => <NoteCard key={note.id} note={note} />)}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📚</div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No uploads yet</h3>
                <p className="text-gray-500 text-sm mb-4">Start sharing your notes to earn points and badges!</p>
                <Link to="/upload" className="btn btn-primary btn-sm">Upload a Note</Link>
              </div>
            )
          )}

          {/* FAVORITES TAB */}
          {activeTab === 'favorites' && (
            favoriteNotes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteNotes.map(note => <NoteCard key={note.id} note={note} />)}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-50 text-red-300 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">❤️</div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No favorite notes</h3>
                <p className="text-gray-500 text-sm mb-4">Explore the library and like notes to save them here.</p>
                <Link to="/explore" className="btn btn-primary btn-sm">Explore Notes</Link>
              </div>
            )
          )}

          {/* ACTIVITY TAB */}
          {activeTab === 'activity' && (
            <div className="max-w-3xl mx-auto">
              {profile?.activity?.length > 0 ? (
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                  {profile.activity.map((act, i) => (
                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 text-xl">
                        {act.points > 0 ? '🏆' : '💸'}
                      </div>
                      
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass-card p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-black ${act.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {act.points > 0 ? `+${act.points} pts` : `${act.points} pts`}
                          </span>
                          <time className="text-xs text-gray-400 font-medium">{new Date(act.date).toLocaleDateString()}</time>
                        </div>
                        <p className="text-gray-700 text-sm">{act.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-10">No recent activity found.</p>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Profile</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input 
                  type="text" 
                  value={editForm.name} 
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
                <input 
                  type="text" 
                  value={editForm.college} 
                  onChange={(e) => setEditForm({...editForm, college: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70 flex items-center gap-2"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
