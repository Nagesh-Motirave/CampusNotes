import { useState, useEffect } from 'react';
import { getLeaderboard } from '../api/users';
import { getInitials } from '../utils/achievementUtils';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await getLeaderboard();
        setLeaders(data);
      } catch (err) {
        console.error('Failed to load leaderboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">🏆 Contributor Leaderboard</h1>
        <p className="text-gray-500">Top uploaders and contributors helping the community.</p>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-gray-600">Rank</th>
                <th className="p-4 font-semibold text-gray-600">Contributor</th>
                <th className="p-4 font-semibold text-gray-600">College</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((leader, index) => (
                <tr key={leader.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-400' :
                      index === 1 ? 'bg-gray-200 text-gray-700 ring-2 ring-gray-400' :
                      index === 2 ? 'bg-orange-100 text-orange-800 ring-2 ring-orange-500' :
                      'text-gray-500'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                        {getInitials(leader.name)}
                      </div>
                      <span className="font-bold text-gray-900">{leader.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-500 text-sm">{leader.college || '—'}</td>
                  <td className="p-4 text-right">
                    <span className="badge badge-purple text-base font-bold">{leader.points || 0}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
