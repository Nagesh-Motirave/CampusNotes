import { useState, useEffect } from 'react';
import { getLeaderboard } from '../api/users';
import { useAuth } from '../context/AuthContext';

/**
 * Leaderboard — displays top contributors sorted by points.
 * Highlights the current user's row if they appear in the rankings.
 */
const Leaderboard = ({ limit = 10, compact = false }) => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await getLeaderboard();
        setLeaders(data.slice(0, limit));
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [limit]);

  /** Get rank medal emoji */
  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  /** Generate initials */
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: compact ? 5 : limit }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="skeleton w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-3 w-16 rounded" />
            </div>
            <div className="skeleton h-6 w-14 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (leaders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <p className="text-sm">No contributors yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {leaders.map((leader, index) => {
        const rank = index + 1;
        const isCurrentUser = user && leader._id === user.id;

        return (
          <div
            key={leader._id}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              isCurrentUser
                ? 'bg-primary-50 border border-primary-200'
                : 'hover:bg-gray-50'
            } ${rank <= 3 ? 'font-medium' : ''}`}
          >
            {/* Rank */}
            <div className={`w-8 text-center text-sm ${rank <= 3 ? 'text-lg' : 'text-gray-500'}`}>
              {getRankIcon(rank)}
            </div>

            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              rank === 1 ? 'bg-amber-100 text-amber-700' :
              rank === 2 ? 'bg-gray-200 text-gray-700' :
              rank === 3 ? 'bg-orange-100 text-orange-700' :
              'bg-primary-100 text-primary-700'
            }`}>
              {getInitials(leader.name)}
            </div>

            {/* Name + College */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm truncate ${isCurrentUser ? 'text-primary-700 font-semibold' : 'text-gray-900'}`}>
                {leader.name}
                {isCurrentUser && <span className="text-primary-500 ml-1">(You)</span>}
              </p>
              {!compact && (
                <p className="text-xs text-gray-500 truncate">{leader.college}</p>
              )}
            </div>

            {/* Points badge */}
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              rank === 1 ? 'bg-amber-100 text-amber-700' :
              rank <= 3 ? 'bg-primary-100 text-primary-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {leader.points || 0} pts
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Leaderboard;
