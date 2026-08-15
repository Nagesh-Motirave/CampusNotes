import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getTopNotes, getNotes, getStats, searchNotes } from '../api/notes';
import { getStudentsCount, getCollegesCount } from '../api/users';
import NoteCard from '../components/NoteCard';
import FilterBar from '../components/FilterBar';
import { NoteGridSkeleton } from '../components/LoadingSkeleton';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Initial filter state from URL ──
  const initFilters = () => ({
    year: searchParams.get('year') || '',
    semester: searchParams.get('semester') || '',
    subject: searchParams.get('subject') || '',
  });

  // ── Core state ──
  const [trendingNotes, setTrendingNotes] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]); // Recently added notes
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

  const isFiltered = filters.year || filters.semester || filters.subject;
  const filteredSectionRef = useRef(null);

  // ── Search & Autocomplete State ──
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const searchWrapperRef = useRef(null);
  const suggestionsListRef = useRef(null);

  const fmtStat = useCallback((n) => {
    if (n === null) return '—';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K+`;
    return `${n}+`;
  }, []);

  // ── Click outside to close suggestions ──
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Load recent searches from localStorage ──
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // ── Debounce search query ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Fetch suggestions ──
  useEffect(() => {
    if (debouncedQuery.trim().length > 1) {
      searchNotes(debouncedQuery, 0, 4).then(res => {
        setSearchSuggestions(res.content || []);
        setSelectedSuggestionIndex(-1);
      }).catch(console.error);
    } else {
      setSearchSuggestions([]);
      setSelectedSuggestionIndex(-1);
    }
  }, [debouncedQuery]);

  // ── One‑time: load trending notes, recently added notes + stats ──
  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        const [topData, statsData, recentData, studentsCount, collegesCount] = await Promise.all([
          getTopNotes({ signal: controller.signal }),
          getStats({ signal: controller.signal }),
          getNotes({ size: 6, sort: 'latest', signal: controller.signal }),
          getStudentsCount({ signal: controller.signal }).catch(() => 0),
          getCollegesCount({ signal: controller.signal }).catch(() => 0)
        ]);
        if (controller.signal.aborted) return;
        setTrendingNotes(Array.isArray(topData) ? topData.slice(0, 6) : []);
        setRecentNotes(recentData.content ? recentData.content.slice(0, 6) : []);
        
        setStats({
          totalNotes: statsData?.totalNotes ?? 0,
          totalColleges: collegesCount ?? 0,
          totalStudents: studentsCount ?? 0,
        });
      } catch (err) {
        if (!controller.signal.aborted) {
            console.error('Failed to fetch notes:', err);
        }
      } finally {
        if (!controller.signal.aborted) {
            setLoading(false);
        }
      }
    };
    fetchData();
    return () => controller.abort();
  }, []);

  // ── Fetch filtered notes whenever filters change ──
  const fetchFilteredNotes = useCallback(async (pageNum = 0, append = false) => {
    setFilterLoading(true);
    try {
      const params = { page: pageNum, size: 9, sort: 'latest' };
      if (filters.year) params.year = filters.year;
      if (filters.semester) params.semester = filters.semester;
      if (filters.subject) params.subject = filters.subject;
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

  useEffect(() => {
    if (isFiltered) {
      setFilterPage(0);
      fetchFilteredNotes(0, false);
      const params = new URLSearchParams();
      if (filters.year) params.set('year', filters.year);
      if (filters.semester) params.set('semester', filters.semester);
      if (filters.subject) params.set('subject', filters.subject);
      setSearchParams(params, { replace: true });
    } else {
      setFilteredNotes([]);
      setFilterPage(0);
      setFilterTotalPages(0);
      setSearchParams({}, { replace: true });
    }
  }, [filters.year, filters.semester, filters.subject]);

  useEffect(() => {
    if (filterPage > 0) {
      fetchFilteredNotes(filterPage, true);
    }
  }, [filterPage]);

  // ── Handlers ──
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setTimeout(() => {
      filteredSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleClearFilters = () => {
    setFilters({ year: '', semester: '', subject: '' });
  };

  const handleSearchSubmit = (e, explicitQuery = null) => {
    if (e) e.preventDefault();
    const q = explicitQuery || searchQuery;
    if (!q.trim()) return;
    
    const updatedRecent = [q, ...recentSearches.filter(s => s !== q)].slice(0, 5);
    setRecentSearches(updatedRecent);
    localStorage.setItem('recentSearches', JSON.stringify(updatedRecent));
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    navigate(`/notes?q=${encodeURIComponent(q)}`);
  };

  /** Scroll the highlighted suggestion into the visible area */
  const scrollSuggestionIntoView = (index) => {
    requestAnimationFrame(() => {
      const item = suggestionsListRef.current?.querySelector(`[data-suggestion-index="${index}"]`);
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    });
  };

  const handleSearchKeyDown = (e) => {
    if (!showSuggestions || searchSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => {
        const next = prev < searchSuggestions.length - 1 ? prev + 1 : 0;
        scrollSuggestionIntoView(next);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => {
        const next = prev > 0 ? prev - 1 : searchSuggestions.length - 1;
        scrollSuggestionIntoView(next);
        return next;
      });
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      const note = searchSuggestions[selectedSuggestionIndex];
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
      navigate(`/notes/${note.id || note._id}`);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const buildFilterTitle = useMemo(() => {
    const parts = [];
    if (filters.year) parts.push(filters.year);
    if (filters.semester) parts.push(`Semester ${filters.semester}`);
    if (filters.subject) parts.push(filters.subject);
    return parts.join(' · ');
  }, [filters.year, filters.semester, filters.subject]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="gradient-hero-overlay pb-10">
          {/* Animated background shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-brand-light/20 rounded-full blur-[100px] animate-pulse-soft" />
            <div className="absolute -bottom-20 -left-20 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[120px] animate-pulse-soft" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary-400/10 rounded-[100%] blur-[80px]" />
          </div>

          <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 flex flex-col items-center">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/40 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/20 text-slate-800 dark:text-white/90 text-sm font-bold mb-8 animate-fade-in shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Over {fmtStat(stats.totalNotes)} Notes Shared
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white mb-6 animate-slide-up leading-[1.1] text-center font-heading tracking-tight">
              Study Smarter.<br />
              <span className="text-gradient drop-shadow-sm">
                Share Knowledge.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-12 animate-slide-up text-center max-w-2xl font-medium leading-relaxed" style={{ animationDelay: '0.1s' }}>
              Find class notes, exam material, and useful resources shared by students. Search by subject, semester, college, or topic.
            </p>

            {/* Smart Search Bar Component */}
            <div className="w-full max-w-3xl relative z-30 animate-slide-up" style={{ animationDelay: '0.2s' }} ref={searchWrapperRef}>
              <form onSubmit={handleSearchSubmit} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-brand rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <input 
                  type="text" 
                  className="w-full h-16 pl-14 pr-36 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/60 dark:border-slate-700 shadow-glass text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-brand/30 focus:border-brand/50 text-lg transition-all font-medium relative z-10"
                  placeholder="What are you studying? Try 'DBMS'..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                    setSelectedSuggestionIndex(-1);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={handleSearchKeyDown}
                />
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-20">
                  <svg className="h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button type="submit" className="absolute right-2 top-2 bottom-2 px-8 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-white font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 z-20">
                  Search
                </button>
              </form>

              {/* Autocomplete Dropdown */}
              {showSuggestions && (searchQuery.length > 0 || recentSearches.length > 0) && (
                <div ref={suggestionsListRef} className="absolute top-full left-0 right-0 mt-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transform origin-top animate-fade-in z-50 max-h-96 overflow-y-auto">
                  {/* Recent Searches */}
                  {searchQuery.trim().length === 0 && recentSearches.length > 0 && (
                    <div className="p-2">
                      <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider flex justify-between items-center">
                        <span>Recent Searches</span>
                        <button onClick={() => { setRecentSearches([]); localStorage.removeItem('recentSearches'); }} className="text-gray-400 hover:text-red-500 transition-colors">Clear</button>
                      </div>
                      {recentSearches.map((term, i) => (
                        <button key={i} onClick={() => { setSearchQuery(term); handleSearchSubmit(null, term); }} className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-primary-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors group">
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span className="text-gray-700 dark:text-gray-200 font-medium">{term}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* AI Suggestions */}
                  {searchQuery.trim().length > 1 && (
                    <div className="p-2">
                      <div className="px-3 py-2 text-xs font-bold text-primary-500 uppercase tracking-wider flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                        AI Suggestions
                      </div>
                      {searchSuggestions.length > 0 ? (
                        searchSuggestions.map((note, index) => (
                          <Link key={note.id || note._id} to={`/notes/${note.id || note._id}`} data-suggestion-index={index} className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors group border-b border-gray-50 dark:border-gray-800 last:border-0 ${index === selectedSuggestionIndex ? 'bg-primary-50 dark:bg-gray-700/50' : 'hover:bg-primary-50 dark:hover:bg-gray-700/50'}`}>
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-400 to-indigo-500 flex items-center justify-center shadow-inner flex-shrink-0">
                              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <div className="overflow-hidden flex-1">
                              <h4 className="text-gray-900 dark:text-white font-semibold truncate group-hover:text-primary-600 transition-colors">{note.title}</h4>
                              <p className="text-xs text-gray-500 truncate">{note.subject}</p>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          </div>
                          No direct matches. Press Enter for a deep AI search.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick stats */}
            <div className="flex items-center justify-center gap-10 mt-16 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              {[
                { label: 'Notes Shared',    value: fmtStat(stats.totalNotes)    },
                { label: 'Total Students', value: fmtStat(stats.totalStudents) },
                { label: 'Colleges',        value: fmtStat(stats.totalColleges) },
              ].map((stat) => (
                <div key={stat.label} className="text-center group">
                  <p className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white drop-shadow-sm group-hover:scale-105 transition-transform font-heading">{stat.value}</p>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.15em] mt-2">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Filter Dropdowns ── */}
      <div className="student-section relative z-20">
        <div className="glass rounded-3xl p-3 shadow-glass transform -translate-y-8 max-w-4xl mx-auto flex justify-center">
          <FilterBar filters={filters} onChange={handleFiltersChange} />
        </div>
      </div>

      {/* ── Filtered Results Section ── */}
      {isFiltered && (
        <section ref={filteredSectionRef} className="student-section pb-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mb-10 p-8 glass rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-[80px]" />
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-brand-light/20 text-brand flex items-center justify-center flex-shrink-0 shadow-sm border border-brand/10">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white font-heading">
                  Showing {buildFilterTitle} Notes
                </h2>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  {filterLoading ? 'Searching...' : `${filteredNotes.length}${filterPage < filterTotalPages - 1 ? '+' : ''} highly relevant results found`}
                </p>
              </div>
            </div>
            <button
              onClick={handleClearFilters}
              className="relative z-10 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              Clear Filters
            </button>
          </div>

          {filterLoading && filterPage === 0 ? (
            <NoteGridSkeleton count={9} />
          ) : filteredNotes.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredNotes.map((note) => (
                  <NoteCard key={note.id || note._id} note={note} />
                ))}
              </div>
              {filterPage < filterTotalPages - 1 && (
                <div className="mt-10 flex justify-center">
                  <button
                    onClick={() => setFilterPage(p => p + 1)}
                    disabled={filterLoading}
                    className="btn-secondary px-8 py-3.5 shadow-sm"
                  >
                    {filterLoading ? 'Loading more...' : 'Load More Results'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-24 glass rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2 font-heading">No exact matches</h3>
              <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8">
                We couldn't find notes matching these exact filters. Try broadening your search.
              </p>
              <button onClick={handleClearFilters} className="btn-secondary">
                Clear all filters
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── Trending & Recent Sections (hidden when filtered) ── */}
      {!isFiltered && (
        <div className="student-section py-16 space-y-24">
          
          {/* Trending Section */}
          <section>
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="section-kicker">Popular right now</span>
                <h2 className="section-heading">Trending Notes</h2>
              </div>
              <Link to="/notes?sort=mostDownloaded" className="text-brand font-bold text-sm hover:text-brand-dark flex items-center gap-1.5 group transition-colors">
                View all <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>

            {loading ? (
              <NoteGridSkeleton count={4} />
            ) : trendingNotes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {trendingNotes.slice(0, 4).map((note) => (
                  <NoteCard key={note.id || note._id} note={note} />
                ))}
              </div>
            ) : null}
          </section>

          {/* Recently Added Section */}
          <section>
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="section-kicker">Just uploaded</span>
                <h2 className="section-heading">Fresh Material</h2>
              </div>
              <Link to="/notes?sort=latest" className="text-brand font-bold text-sm hover:text-brand-dark flex items-center gap-1.5 group transition-colors">
                View all <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>

            {loading ? (
              <NoteGridSkeleton count={4} />
            ) : recentNotes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recentNotes.slice(0, 4).map((note) => (
                  <NoteCard key={note.id || note._id} note={note} />
                ))}
              </div>
            ) : null}
          </section>

        </div>
      )}

      {/* ── Request a Note CTA ── */}
      <section className="student-section pb-20">
        <div className="gradient-primary rounded-[3rem] p-10 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.07%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50 animate-float" />
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-5 font-heading">Still can't find what you need?</h2>
            <p className="text-white/90 mb-10 text-lg font-medium">
              Don't worry! You can request specific notes and let fellow students or our verified uploaders help you out.
            </p>
            <Link
              to={isAuthenticated ? '/request-notes' : '/login'}
              className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-white text-slate-900 font-extrabold hover:scale-105 transition-all shadow-xl hover:shadow-2xl"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Request a Note
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <span className="text-base font-bold text-gray-900 dark:text-white">Campus Notes Hub</span>
            </div>
            <p className="text-sm font-medium text-gray-500">© 2026 Campus Notes Hub. Student Built.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
