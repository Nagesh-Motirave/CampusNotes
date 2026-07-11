import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import StatCard from '../../components/admin/StatCard';
import {
  getOverviewStats,
  getUploadDownloadStats,
  getTopDownloaded,
  getTrendingSubjects,
  getPendingApproval,
  approveNote,
  getNoteRequestStats,
  getUniversityStats,
  getSearchAnalytics,
  getRecentActivities,
  getUserOverviewStats,
  getUsersByCollege,
  getRecentUsers,
  getTopContributors,
  updateUserRole,
  getArchivedNotes,
  archiveNote,
  restoreNote,
  permanentlyDeleteNote,
} from '../../api/admin';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'pending', label: 'Pending Approval' },
  { id: 'archived', label: 'Archived Resources' },
  { id: 'users', label: 'Users' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'activity', label: 'Activity' },
];

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

const fmt = (n) => {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  };
};

const ChartCard = ({ title, children, className = '' }) => (
  <div className={`glass-card p-5 ${className}`}>
    <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
    {children}
  </div>
);

/**
 * AdminDashboard — full admin analytics panel with charts, approvals, and user management.
 */
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);

  const [overview, setOverview] = useState(null);
  const [uploadStats, setUploadStats] = useState(null);
  const [topDownloaded, setTopDownloaded] = useState([]);
  const [trendingSubjects, setTrendingSubjects] = useState([]);
  const [pending, setPending] = useState([]);
  const [archivedNotes, setArchivedNotes] = useState([]);
  const [noteRequests, setNoteRequests] = useState(null);
  const [universityStats, setUniversityStats] = useState([]);
  const [searchAnalytics, setSearchAnalytics] = useState(null);
  const [activities, setActivities] = useState([]);

  const [userOverview, setUserOverview] = useState(null);
  const [usersByCollege, setUsersByCollege] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [topContributors, setTopContributors] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        overviewData, uploadData, topData, trendingData, pendingData, archivedData,
        requestsData, uniData, searchData, activityData,
        userOverviewData, collegeData, recentUsersData, contributorsData,
      ] = await Promise.all([
        getOverviewStats(),
        getUploadDownloadStats(),
        getTopDownloaded(),
        getTrendingSubjects(),
        getPendingApproval(),
        getArchivedNotes(),
        getNoteRequestStats(),
        getUniversityStats(),
        getSearchAnalytics(),
        getRecentActivities(),
        getUserOverviewStats(),
        getUsersByCollege(),
        getRecentUsers(),
        getTopContributors(),
      ]);

      setOverview(overviewData);
      setUploadStats(uploadData);
      setTopDownloaded(Array.isArray(topData) ? topData : []);
      setTrendingSubjects(Array.isArray(trendingData) ? trendingData : []);
      setPending(Array.isArray(pendingData) ? pendingData : []);
      setArchivedNotes(Array.isArray(archivedData) ? archivedData : []);
      setNoteRequests(requestsData);
      setUniversityStats(Array.isArray(uniData) ? uniData : []);
      setSearchAnalytics(searchData);
      setActivities(Array.isArray(activityData) ? activityData : []);
      setUserOverview(userOverviewData);
      setUsersByCollege(Array.isArray(collegeData) ? collegeData : []);
      setRecentUsers(Array.isArray(recentUsersData) ? recentUsersData : []);
      setTopContributors(Array.isArray(contributorsData) ? contributorsData : []);
    } catch (error) {
      console.error('Failed to load admin dashboard data:', error);
      toast.error(`Failed to load admin dashboard data: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApprove = async (id) => {
    setApproving(id);
    try {
      await approveNote(id);
      toast.success('Note approved successfully');
      setPending((prev) => prev.filter((n) => n.id !== id));
      setOverview((prev) => prev ? { ...prev, pendingApproval: Math.max(0, prev.pendingApproval - 1) } : prev);
    } catch {
      toast.error('Failed to approve note');
    } finally {
      setApproving(null);
    }
  };

  const handleArchive = async (id) => {
    try {
      await archiveNote(id);
      toast.success('Note archived successfully');
      setPending((prev) => prev.filter((n) => n.id !== id));
      loadData(); // Reload to refresh lists
    } catch {
      toast.error('Failed to archive note');
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreNote(id);
      toast.success('Note restored successfully');
      setArchivedNotes((prev) => prev.filter((n) => n.id !== id));
      loadData();
    } catch {
      toast.error('Failed to restore note');
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this resource? This action cannot be undone.")) {
      return;
    }
    try {
      await permanentlyDeleteNote(id);
      toast.success('Note permanently deleted');
      setArchivedNotes((prev) => prev.filter((n) => n.id !== id));
    } catch {
      toast.error('Failed to delete note');
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await updateUserRole(userId, role);
      toast.success(`User role updated to ${role}`);
      setRecentUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
    } catch {
      toast.error('Failed to update user role');
    }
  };

  const uploadChartData = (uploadStats?.dailyUploads || []).map((d) => ({
    date: d.date?.slice(5) || d.date,
    count: d.count,
  }));

  const searchChartData = (searchAnalytics?.dailyVolume || []).map((d) => ({
    date: d.date?.slice(5) || d.date,
    count: d.count,
  }));

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="skeleton h-10 w-64 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
          </div>
          <div className="skeleton h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Platform analytics, approvals, and user management</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="btn-secondary text-sm py-2 px-4">
            Refresh
          </button>
          <Link to="/" className="btn-ghost text-sm py-2 px-4">
            Back to Site
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-6 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.id === 'pending' && pending.length > 0 && (
              <span className="ml-2 badge badge-red">{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Uploads" value={fmt(overview?.totalUploads)} color="primary" icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            } />
            <StatCard label="Total Downloads" value={fmt(overview?.totalDownloads)} color="emerald" icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            } />
            <StatCard label="Pending Approval" value={fmt(overview?.pendingApproval)} color="amber" subtext="Notes awaiting review" icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            } />
            <StatCard label="Open Requests" value={fmt(overview?.openRequests)} color="rose" subtext={`${overview?.totalRequests ?? 0} total requests`} icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            } />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={fmt(userOverview?.totalUsers)} color="blue" />
            <StatCard label="Verified Users" value={fmt(userOverview?.verifiedUsers)} color="emerald" />
            <StatCard label="New This Week" value={fmt(userOverview?.newUsersThisWeek)} color="primary" />
            <StatCard label="Uploads This Week" value={fmt(uploadStats?.uploadsThisWeek)} color="primary" subtext={`${uploadStats?.uploadsLastWeek ?? 0} last week`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Daily Uploads (Last 30 Days)">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={uploadChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Top Downloaded Notes">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {topDownloaded.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No notes yet</p>
                ) : topDownloaded.map((note, i) => (
                  <div key={note.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xs font-bold text-primary-600 w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{note.title}</p>
                      <p className="text-xs text-gray-400">{note.subject} · {note.uploaderName}</p>
                    </div>
                    <span className="badge badge-blue">{note.downloads} dl</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          <ChartCard title="Trending Subjects">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trendingSubjects} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="subject" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="totalDownloads" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Downloads" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Pending Approval Tab */}
      {activeTab === 'pending' && (
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Notes Pending Approval</h3>
            <p className="text-sm text-gray-500">{pending.length} note(s) awaiting review</p>
          </div>
          {pending.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-sm">All notes are approved!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Title</th>
                    <th className="px-5 py-3 text-left">Subject</th>
                    <th className="px-5 py-3 text-left">Uploader</th>
                    <th className="px-5 py-3 text-left">College</th>
                    <th className="px-5 py-3 text-left">Uploaded</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pending.map((note) => (
                    <tr key={note.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900 max-w-[200px] truncate">{note.title}</td>
                      <td className="px-5 py-3 text-gray-600">{note.subject}</td>
                      <td className="px-5 py-3 text-gray-600">{note.uploaderName}</td>
                      <td className="px-5 py-3 text-gray-600">{note.college || '—'}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{fmtDate(note.createdAt)}</td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleApprove(note.id)}
                          disabled={approving === note.id}
                          className="btn-primary text-xs py-1.5 px-3"
                        >
                          {approving === note.id ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleArchive(note.id)}
                          className="btn-secondary text-xs py-1.5 px-3 ml-2"
                        >
                          Archive
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Archived Resources Tab */}
      {activeTab === 'archived' && (
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-900">Archived Resources</h3>
              <p className="text-sm text-gray-500">Soft deleted items that are hidden from public view</p>
            </div>
            <div className="badge badge-yellow">{archivedNotes.length} archived</div>
          </div>
          {archivedNotes.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <p className="text-sm">No archived resources found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Title</th>
                    <th className="px-5 py-3 text-left">Subject</th>
                    <th className="px-5 py-3 text-left">Uploader</th>
                    <th className="px-5 py-3 text-left">Archived Date</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {archivedNotes.map((note) => (
                    <tr key={note.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900 max-w-[200px] truncate">{note.title}</td>
                      <td className="px-5 py-3 text-gray-600">{note.subject}</td>
                      <td className="px-5 py-3 text-gray-600">{note.uploaderName}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{fmtDate(note.createdAt)}</td>
                      <td className="px-5 py-3 text-right flex justify-end gap-2">
                        <button
                          onClick={() => handleRestore(note.id)}
                          className="btn-secondary text-xs py-1.5 px-3 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(note.id)}
                          className="btn-primary text-xs py-1.5 px-3 bg-red-600 hover:bg-red-700"
                        >
                          Permanently Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total Users" value={fmt(userOverview?.totalUsers)} color="blue" />
            <StatCard label="Admins" value={fmt(userOverview?.adminUsers)} color="primary" />
            <StatCard label="New This Month" value={fmt(userOverview?.newUsersThisMonth)} color="emerald" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Users by College">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={usersByCollege.slice(0, 6)}
                    dataKey="userCount"
                    nameKey="college"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ college, userCount }) => `${college?.slice(0, 12)} (${userCount})`}
                  >
                    {usersByCollege.slice(0, 6).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Top Contributors">
              <div className="space-y-2">
                {topContributors.map((user, i) => (
                  <div key={user.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xs font-bold text-primary-600 w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.college || 'No college'}</p>
                    </div>
                    <span className="badge badge-purple">{user.points || 0} pts</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Recent Registrations</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Name</th>
                    <th className="px-5 py-3 text-left">Email</th>
                    <th className="px-5 py-3 text-left">College</th>
                    <th className="px-5 py-3 text-left">Points</th>
                    <th className="px-5 py-3 text-left">Role</th>
                    <th className="px-5 py-3 text-left">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{user.name}</td>
                      <td className="px-5 py-3 text-gray-600">{user.email}</td>
                      <td className="px-5 py-3 text-gray-600">{user.college || '—'}</td>
                      <td className="px-5 py-3 text-gray-600">{user.points || 0}</td>
                      <td className="px-5 py-3">
                        <select
                          value={user.role || 'USER'}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{fmtDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Search Volume (Last 14 Days)">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={searchChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Notes by College">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={universityStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="college" tick={{ fontSize: 9 }} interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="noteCount" fill="#a855f7" radius={[4, 4, 0, 0]} name="Notes" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Top Search Queries">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(searchAnalytics?.topQueries || []).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No search data yet</p>
                ) : (searchAnalytics?.topQueries || []).map((q, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-700 truncate flex-1">{q.query}</span>
                    <span className="badge badge-blue ml-2">{q.count}</span>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="Note Requests">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-2xl font-bold text-gray-900">{noteRequests?.totalRequests ?? 0}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl">
                    <p className="text-2xl font-bold text-amber-700">{noteRequests?.openRequests ?? 0}</p>
                    <p className="text-xs text-gray-500">Open</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl">
                    <p className="text-2xl font-bold text-emerald-700">{noteRequests?.fulfilledRequests ?? 0}</p>
                    <p className="text-xs text-gray-500">Fulfilled</p>
                  </div>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(noteRequests?.recentRequests || []).map((req) => (
                    <div key={req.id} className="text-sm py-2 border-b border-gray-50">
                      <p className="font-medium text-gray-900">{req.subject}</p>
                      <p className="text-xs text-gray-400">{req.requesterName} · Sem {req.semester}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="glass-card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Platform Activity</h3>
            <p className="text-sm text-gray-500">Last 50 uploads across the platform</p>
          </div>
          <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
            {activities.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-16">No activity yet</p>
            ) : activities.map((item, i) => (
              <div key={i} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50">
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{item.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.subject}{item.college ? ` · ${item.college}` : ''} · {fmtDate(item.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
