import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTopNotes, getNotes, getStats } from '../api/notes';
import NoteCard from '../components/NoteCard';
import FilterBar from '../components/FilterBar';

import { NoteGridSkeleton } from '../components/LoadingSkeleton';
import { useAuth } from '../context/AuthContext';

/**
 * Home Page — hero section with search, trending notes, filters, ad banners, and CTA.
 */
const Home = () => {
  const [trendingNotes, setTrendingNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ year: '', semester: '', subject: '', college: '' });
  const [stats, setStats] = useState({ totalNotes: null, totalColleges: null, totalStudents: null });
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  /** Format a number as a compact string, e.g. 1234 → "1.2K+" */
  const fmtStat = (n) => {
    if (n === null) return '—';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K+`;
    return `${n}+`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topData, allData, statsData] = await Promise.all([
          getTopNotes(),
          getNotes({ page: 0, size: 6, sort: 'latest' }),
          getStats(),
        ]);
        setTrendingNotes(Array.isArray(topData) ? topData.slice(0, 6) : []);
        setFilteredNotes(Array.isArray(allData.content) ? allData.content : Array.isArray(allData) ? allData.slice(0, 6) : []);
        if (statsData) {
          setStats({
            totalNotes: statsData.totalNotes ?? 0,
            totalColleges: statsData.totalColleges ?? 0,
            totalStudents: statsData.totalStudents ?? 0,
          });
        }
        // Load recently viewed
        import('../utils/recentlyViewedUtils').then(mod => {
          setRecentNotes(mod.getRecentlyViewed());
        });
      } catch (err) {
        console.error('Failed to fetch notes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/notes?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    navigate(`/notes?${new URLSearchParams(
      Object.fromEntries(Object.entries(newFilters).filter(([, v]) => v))
    ).toString()}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="gradient-hero-overlay">
          {/* Animated background shapes */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse-soft" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-400/5 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="text-center max-w-3xl mx-auto">
              {/* Tag */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-6 animate-fade-in">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                </svg>
                Trusted by 10,000+ students
              </div>

              {/* Heading */}
              <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-5 animate-slide-up leading-tight">
                Find Notes.{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-orange-400">
                  Share Knowledge.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-white/80 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Your one-stop platform for sharing and discovering quality study notes from colleges across India.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="max-w-xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="relative flex">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search notes by subject, topic, or college..."
                    className="flex-1 px-6 py-4 rounded-2xl bg-white/95 backdrop-blur-sm text-gray-900 placeholder-gray-400 text-base focus:outline-none focus:ring-4 focus:ring-white/30 shadow-2xl"
                    id="hero-search"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-colors shadow-lg"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Quick stats */}
              <div className="flex items-center justify-center gap-8 mt-10 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                {[
                  { label: 'Notes Shared',    value: fmtStat(stats.totalNotes)    },
                  { label: 'Active Students', value: fmtStat(stats.totalStudents) },
                  { label: 'Colleges',        value: fmtStat(stats.totalColleges) },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-white/60 uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <FilterBar filters={filters} onChange={handleFiltersChange} />
      </div>

      {/* Trending Notes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🔥 Trending Notes</h2>
            <p className="text-sm text-gray-500 mt-1">Most downloaded this week</p>
          </div>
          <Link to="/notes?sort=mostDownloaded" className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors">
            View all
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <NoteGridSkeleton count={6} />
        ) : trendingNotes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {trendingNotes.map((note) => (
              <NoteCard key={note.id || note._id} note={note} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <svg className="w-20 h-20 mx-auto mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No notes yet</h3>
            <p className="text-gray-400 mb-4">Be the first to share your study notes!</p>
            {isAuthenticated ? (
              <Link to="/upload" className="btn-primary">Upload Notes</Link>
            ) : (
              <Link to="/register" className="btn-primary">Get Started</Link>
            )}
          </div>
        )}
      </section>

      {/* Request a Note CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="gradient-primary rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
          <div className="relative">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Can't find what you need?</h2>
            <p className="text-white/80 mb-6 max-w-lg mx-auto">
              Request specific notes and let fellow students help you out. Earn points for helping others too!
            </p>
            <Link
              to={isAuthenticated ? '/request-notes' : '/login'}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-700 font-semibold hover:bg-gray-50 transition-colors shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Request a Note
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-700">Campus Notes Hub</span>
            </div>
            <p className="text-xs text-gray-400">© 2025 Campus Notes Hub. Made By Nagesh Motirave</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
