import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getTopNotes, getNotes, getStats } from '../api/notes';
import NoteCard from '../components/NoteCard';
import FilterBar from '../components/FilterBar';

import { NoteGridSkeleton } from '../components/LoadingSkeleton';
import { useAuth } from '../context/AuthContext';

/**
 * Home Page — hero section with search, quick category chips, inline filtering,
 * trending notes, and CTA.
 *
 * Category clicks (Diploma, Engineering, Semester, Subject, Branch, University)
 * now filter and display matching notes directly on this page instead of
 * redirecting to the Library (/notes) route.
 */
const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Initial filter state from URL (for shareable / refreshable links) ──
  const initFilters = () => ({
    year: searchParams.get('year') || '',
    semester: searchParams.get('semester') || '',
    subject: searchParams.get('subject') || '',
    college: searchParams.get('college') || '',
  });

  // ── Core state ──
  const [trendingNotes, setTrendingNotes] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(initFilters);
  const [stats, setStats] = useState({ totalNotes: null, totalColleges: null, totalStudents: null });
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // ── Filtered results state ──
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterPage, setFilterPage] = useState(0);
  const [filterTotalPages, setFilterTotalPages] = useState(0);

  const isFiltered = filters.year || filters.semester || filters.subject || filters.college;

  // Ref to the filtered‑results section so we can scroll to it
  const filteredSectionRef = useRef(null);

  /** Format a number as a compact string, e.g. 1234 → "1.2K+" */
  const fmtStat = (n) => {
    if (n === null) return '—';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K+`;
    return `${n}+`;
  };

  // ── One‑time: load trending notes + stats ──
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topData, statsData] = await Promise.all([
          getTopNotes(),
          getStats(),
        ]);
        setTrendingNotes(Array.isArray(topData) ? topData.slice(0, 6) : []);
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

  // ── Fetch filtered notes whenever filters change ──
  const fetchFilteredNotes = useCallback(async (pageNum = 0, append = false) => {
    setFilterLoading(true);
    try {
      const params = { page: pageNum, size: 9, sort: 'latest' };
      if (filters.year) params.year = filters.year;
      if (filters.semester) params.semester = filters.semester;
      if (filters.subject) params.subjectName = filters.subject;
      if (filters.college) params.college = filters.college; // Changed from params.university to params.college
      const data = await getNotes(params);

      if (data.content) {
        setFilteredNotes(prev => append ? [...prev, ...data.content] : data.content);
        setFilterTotalPages(data.totalPages || 1);
      } else if (Array.isArray(data)) {
        setFilteredNotes(prev => append ? [...prev, ...data] : data);
        setFilterTotalPages(1);
      } else {
        setFilteredNotes(prev => append ? prev : []);
        setFilterTotalPages(0);
      }
    } catch (err) {
      console.error('Failed to fetch filtered notes:', err);
      setFilteredNotes(prev => append ? prev : []);
    } finally {
      setFilterLoading(false);
    }
  }, [filters]);

  // When filters change → reset page, sync URL, fetch
  useEffect(() => {
    if (isFiltered) {
      setFilterPage(0);
      fetchFilteredNotes(0, false);

      // Sync filters to URL query params (without navigating)
      const params = new URLSearchParams();
      if (filters.year) params.set('year', filters.year);
      if (filters.semester) params.set('semester', filters.semester);
      if (filters.subject) params.set('subject', filters.subject);
      if (filters.college) params.set('college', filters.college);
      setSearchParams(params, { replace: true });
    } else {
      setFilteredNotes([]);
      setFilterPage(0);
      setFilterTotalPages(0);
      // Clear URL params
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.year, filters.semester, filters.subject, filters.college]);

  // Handle pagination (Load More)
  useEffect(() => {
    if (filterPage > 0) {
      fetchFilteredNotes(filterPage, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterPage]);

  // ── Handlers ──
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    // Scroll to filtered section after a tick
    setTimeout(() => {
      filteredSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleClearFilters = () => {
    setFilters({ year: '', semester: '', subject: '', college: '' });
  };


  // ── Build filter description title ──
  const buildFilterTitle = () => {
    const parts = [];
    if (filters.year) parts.push(filters.year);
    if (filters.semester) parts.push(`Semester ${filters.semester}`);
    if (filters.subject) parts.push(filters.subject);
    if (filters.college) parts.push(filters.college);
    return parts.join(' · ');
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


      {/* ── Filter Dropdowns ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <FilterBar filters={filters} onChange={handleFiltersChange} />
      </div>

      {/* ── Filtered Results Section (visible when any filter is active) ── */}
      {isFiltered && (
        <section ref={filteredSectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filter description banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 bg-gradient-to-r from-primary-50 to-indigo-50 rounded-2xl border border-primary-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Showing {buildFilterTitle()} Notes
                </h2>
                <p className="text-sm text-gray-500">
                  {filterLoading ? 'Searching...' : `${filteredNotes.length}${filterPage < filterTotalPages - 1 ? '+' : ''} results found`}
                </p>
              </div>
            </div>
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-gray-700 font-medium text-sm border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
              id="clear-filters-btn"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Filters
            </button>
          </div>

          {/* Filtered notes grid */}
          {filterLoading && filterPage === 0 ? (
            <NoteGridSkeleton count={9} />
          ) : filteredNotes.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredNotes.map((note) => (
                  <NoteCard key={note.id || note._id} note={note} />
                ))}
              </div>
              {filterPage < filterTotalPages - 1 && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => setFilterPage(p => p + 1)}
                    disabled={filterLoading}
                    className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-white text-gray-700 font-semibold text-sm border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-50"
                    id="load-more-filtered"
                  >
                    {filterLoading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Loading...
                      </>
                    ) : (
                      <>
                        Load More
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No notes found</h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-4">
                We couldn't find notes matching your filters. Try adjusting or clearing them.
              </p>
              <button
                onClick={handleClearFilters}
                className="text-primary-600 font-medium text-sm hover:text-primary-700 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── Trending Notes (hidden when filters are active) ── */}
      {!isFiltered && (
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
      )}

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
