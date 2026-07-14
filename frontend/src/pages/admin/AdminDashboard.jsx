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
  updateUserRole,
  getArchivedNotes,
  archiveNote,
  restoreNote,
  permanentlyDeleteNote,
} from '../../api/admin';
import {
  getAllColleges as fetchAllColleges,
  getPendingColleges as fetchPendingColleges,
  approveCollege as apiApproveCollege,
  updateCollege as apiUpdateCollege,
  mergeColleges as apiMergeColleges,
  triggerCollegeMigration,
} from '../../api/colleges';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'pending', label: 'Pending Approval' },
  { id: 'archived', label: 'Archived Resources' },
  { id: 'users', label: 'Users' },
  { id: 'colleges', label: 'Colleges' },
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

  // College management state
  const [allColleges, setAllColleges] = useState([]);
  const [pendingColleges, setPendingColleges] = useState([]);
  const [editingCollege, setEditingCollege] = useState(null);
  const [editCollegeForm, setEditCollegeForm] = useState({ officialName: '', shortName: '', aliases: '' });
  const [mergeModal, setMergeModal] = useState({ open: false, targetId: null, targetName: '' });
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [collegeSearchFilter, setCollegeSearchFilter] = useState('');
  const [migrationResult, setMigrationResult] = useState(null);
  const [migrateLoading, setMigrateLoading] = useState(false);

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
    } catch (error) {
      console.error('Failed to load admin dashboard data:', error);
      toast.error(`Failed to load admin dashboard data: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Load college data separately
    Promise.all([
      fetchAllColleges().catch(() => []),
      fetchPendingColleges().catch(() => []),
    ]).then(([all, pend]) => {
      setAllColleges(Array.isArray(all) ? all : []);
      setPendingColleges(Array.isArray(pend) ? pend : []);
    });
  }, [loadData]);

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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <StatCard label="Total Students" value={fmt(userOverview?.totalUsers)} color="blue" />
            <StatCard label="Total Unique Colleges" value={fmt(usersByCollege?.length)} color="emerald" />
            <StatCard label="Total Approved Notes" value={fmt((overview?.totalUploads || 0) - (overview?.pendingApproval || 0))} color="primary" />
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatCard label="Total Students" value={fmt(userOverview?.totalUsers)} color="blue" />
            <StatCard label="Total Unique Colleges" value={fmt(usersByCollege?.length)} color="emerald" />
            <StatCard label="Total Approved Notes" value={fmt((overview?.totalUploads || 0) - (overview?.pendingApproval || 0))} color="primary" />
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

      {/* Colleges Tab */}
      {activeTab === 'colleges' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total Colleges" value={fmt(allColleges.length)} color="blue" />
            <StatCard label="Verified" value={fmt(allColleges.filter(c => c.status === 'Verified').length)} color="emerald" />
            <StatCard label="Pending" value={fmt(pendingColleges.length)} color="amber" />
          </div>

          {/* Migration Section */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Data Migration</h3>
                <p className="text-sm text-gray-500">Scan existing user data, group duplicates, and create college records.</p>
              </div>
              <button
                onClick={async () => {
                  if (!window.confirm('This will scan all existing users and create/update college records. This is safe and additive-only (no data is deleted). Proceed?')) return;
                  setMigrateLoading(true);
                  try {
                    const result = await triggerCollegeMigration();
                    setMigrationResult(result);
                    toast.success(`Migration complete: ${result.collegesCreated} colleges created, ${result.usersUpdated} users updated`);
                    // Reload college data
                    const [all, pend] = await Promise.all([fetchAllColleges().catch(() => []), fetchPendingColleges().catch(() => [])]);
                    setAllColleges(Array.isArray(all) ? all : []);
                    setPendingColleges(Array.isArray(pend) ? pend : []);
                  } catch (err) {
                    toast.error('Migration failed: ' + (err.response?.data?.message || err.message));
                  } finally {
                    setMigrateLoading(false);
                  }
                }}
                disabled={migrateLoading}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {migrateLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Running...</>
                ) : 'Run Migration'}
              </button>
            </div>
            {migrationResult && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-sm">
                <p><strong>Distinct strings found:</strong> {migrationResult.totalDistinctStrings}</p>
                <p><strong>Unique colleges after grouping:</strong> {migrationResult.uniqueCollegesAfterGrouping}</p>
                <p><strong>Colleges created:</strong> {migrationResult.collegesCreated}</p>
                <p><strong>Users updated:</strong> {migrationResult.usersUpdated}</p>
              </div>
            )}
          </div>

          {/* Pending Colleges */}
          {pendingColleges.length > 0 && (
            <div className="glass-card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Pending Colleges ({pendingColleges.length})</h3>
                <p className="text-sm text-gray-500">Review and approve newly added colleges</p>
              </div>
              <div className="divide-y divide-gray-50">
                {pendingColleges.map((college) => (
                  <div key={college.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{college.officialName}</p>
                      <p className="text-xs text-gray-400">
                        {college.shortName !== college.officialName && college.shortName}
                        {college.aliases?.length > 0 && ` · Aliases: ${college.aliases.join(', ')}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          try {
                            await apiApproveCollege(college.id);
                            toast.success('College approved');
                            setPendingColleges(prev => prev.filter(c => c.id !== college.id));
                            setAllColleges(prev => prev.map(c => c.id === college.id ? { ...c, status: 'Verified' } : c));
                          } catch (err) {
                            toast.error('Failed to approve: ' + (err.message || err));
                          }
                        }}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setEditingCollege(college);
                          setEditCollegeForm({
                            officialName: college.officialName || '',
                            shortName: college.shortName || '',
                            aliases: (college.aliases || []).join(', '),
                          });
                        }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Colleges Table */}
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">All Colleges ({allColleges.length})</h3>
              </div>
              <input
                type="text"
                placeholder="Filter colleges..."
                value={collegeSearchFilter}
                onChange={(e) => setCollegeSearchFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 w-64"
              />
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Official Name</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Short Name</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Aliases</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                    <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allColleges
                    .filter(c => !collegeSearchFilter || c.officialName?.toLowerCase().includes(collegeSearchFilter.toLowerCase()) || c.shortName?.toLowerCase().includes(collegeSearchFilter.toLowerCase()))
                    .map((college) => (
                    <tr key={college.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{college.officialName}</td>
                      <td className="px-5 py-3 text-gray-600">{college.shortName}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs max-w-xs truncate">{(college.aliases || []).join(', ')}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${college.status === 'Verified' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {college.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => {
                              setEditingCollege(college);
                              setEditCollegeForm({
                                officialName: college.officialName || '',
                                shortName: college.shortName || '',
                                aliases: (college.aliases || []).join(', '),
                              });
                            }}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setMergeModal({ open: true, targetId: college.id, targetName: college.officialName })}
                            className="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded text-xs font-medium transition-colors"
                          >
                            Merge Into
                          </button>
                          {college.status !== 'Verified' && (
                            <button
                              onClick={async () => {
                                try {
                                  await apiApproveCollege(college.id);
                                  toast.success('College approved');
                                  setAllColleges(prev => prev.map(c => c.id === college.id ? { ...c, status: 'Verified' } : c));
                                  setPendingColleges(prev => prev.filter(c => c.id !== college.id));
                                } catch (err) {
                                  toast.error('Failed to approve');
                                }
                              }}
                              className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs font-medium transition-colors"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Edit College Modal */}
          {editingCollege && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Edit College</h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const aliasArray = editCollegeForm.aliases
                        .split(',')
                        .map(a => a.trim())
                        .filter(Boolean);
                      await apiUpdateCollege(editingCollege.id, {
                        officialName: editCollegeForm.officialName,
                        shortName: editCollegeForm.shortName,
                        aliases: aliasArray,
                      });
                      toast.success('College updated');
                      setAllColleges(prev => prev.map(c => c.id === editingCollege.id ? {
                        ...c,
                        officialName: editCollegeForm.officialName,
                        shortName: editCollegeForm.shortName,
                        aliases: aliasArray,
                      } : c));
                      setEditingCollege(null);
                    } catch (err) {
                      toast.error('Update failed: ' + (err.message || err));
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Official Name</label>
                    <input
                      type="text"
                      value={editCollegeForm.officialName}
                      onChange={(e) => setEditCollegeForm({ ...editCollegeForm, officialName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Short Name</label>
                    <input
                      type="text"
                      value={editCollegeForm.shortName}
                      onChange={(e) => setEditCollegeForm({ ...editCollegeForm, shortName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aliases (comma-separated)</label>
                    <input
                      type="text"
                      value={editCollegeForm.aliases}
                      onChange={(e) => setEditCollegeForm({ ...editCollegeForm, aliases: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all"
                      placeholder="e.g. DGOI, D.G.O.I."
                    />
                  </div>
                  <div className="flex gap-3 justify-end mt-6">
                    <button type="button" onClick={() => setEditingCollege(null)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Merge Modal */}
          {mergeModal.open && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Merge Duplicate</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Merge another college <strong>into</strong> <span className="text-primary-600 font-semibold">{mergeModal.targetName}</span>.
                  All students from the duplicate will be moved to this college.
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select duplicate to merge</label>
                  <select
                    value={mergeTargetId}
                    onChange={(e) => setMergeTargetId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all"
                  >
                    <option value="">Select a college...</option>
                    {allColleges
                      .filter(c => c.id !== mergeModal.targetId)
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.officialName} ({c.shortName})</option>
                      ))}
                  </select>
                </div>
                <div className="flex gap-3 justify-end mt-6">
                  <button
                    onClick={() => { setMergeModal({ open: false, targetId: null, targetName: '' }); setMergeTargetId(''); }}
                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!mergeTargetId}
                    onClick={async () => {
                      if (!window.confirm(`Merge "${allColleges.find(c => c.id === mergeTargetId)?.officialName}" INTO "${mergeModal.targetName}"? This cannot be undone.`)) return;
                      try {
                        const result = await apiMergeColleges(mergeModal.targetId, mergeTargetId);
                        toast.success(`Merge successful: ${result.usersUpdated} users updated`);
                        setAllColleges(prev => prev.filter(c => c.id !== mergeTargetId));
                        setPendingColleges(prev => prev.filter(c => c.id !== mergeTargetId));
                        setMergeModal({ open: false, targetId: null, targetName: '' });
                        setMergeTargetId('');
                      } catch (err) {
                        toast.error('Merge failed: ' + (err.response?.data?.message || err.message));
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    Merge
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
