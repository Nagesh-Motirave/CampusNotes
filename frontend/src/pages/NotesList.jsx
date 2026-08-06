import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getNotes, searchNotes, getDistinctValues } from '../api/notes';
import NoteCard from '../components/NoteCard';

import { NoteGridSkeleton } from '../components/LoadingSkeleton';

const NotesList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Hierarchy State
  const [university, setUniversity] = useState(searchParams.get('uni') || null);
  const [branch, setBranch] = useState(searchParams.get('branch') || null);
  
  // Selection Panel State (available once branch is selected)
  const [year, setYear] = useState(searchParams.get('year') || null);
  const [semester, setSemester] = useState(searchParams.get('sem') ? parseInt(searchParams.get('sem')) : null);
  const [resourceType, setResourceType] = useState(searchParams.get('type') || null);
  const [subjectFilter, setSubjectFilter] = useState(searchParams.get('sub') || null);

  // Dynamic Options State
  const [availableYears, setAvailableYears] = useState([]);
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [availableResourceTypes, setAvailableResourceTypes] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);

  // View State (home, search, trending, most_downloaded, recently_uploaded, hierarchy)
  const [currentView, setCurrentView] = useState(searchParams.get('view') || (university ? 'hierarchy' : 'home'));
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  // Data State
  const [options, setOptions] = useState([]); // For University/Branch folder grid
  const [notes, setNotes] = useState([]);
  const [syllabusNotes, setSyllabusNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Sync state to URL for shareability
  useEffect(() => {
    const params = new URLSearchParams();
    if (currentView) params.set('view', currentView);
    if (searchQuery) params.set('q', searchQuery);
    if (university) params.set('uni', university);
    if (branch) params.set('branch', branch);
    if (year) params.set('year', year);
    if (semester) params.set('sem', semester);
    if (resourceType) params.set('type', resourceType);
    if (subjectFilter) params.set('sub', subjectFilter);
    setSearchParams(params, { replace: true });
  }, [currentView, searchQuery, university, branch, year, semester, resourceType, subjectFilter, setSearchParams]);


  // Effect to load data
  useEffect(() => {
    setPage(0); // Reset page on state change
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, searchQuery, university, branch, year, semester, resourceType, subjectFilter]);

  // Handle Pagination
  useEffect(() => {
    if (page > 0) loadData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);


  const loadData = async (isPagination = false) => {
    setLoading(true);
    try {
      if (currentView === 'hierarchy') {
        if (!university) {
           const unis = await getDistinctValues('university');
           setOptions(unis);
        } else if (!branch) {
           const branches = await getDistinctValues('branch', { university });
           setOptions(branches);
        } else {
           // Branch is selected! 
           setOptions([]); // No more folder grid

           // Fetch available years, semesters, types based on current selections
           const [years, sems, types] = await Promise.all([
             getDistinctValues('year', { university, branch }),
             getDistinctValues('semester', { university, branch, year: year || undefined }),
             getDistinctValues('resourceType', { university, branch, year: year || undefined, semester: semester || undefined })
           ]);
           
           setAvailableYears(years);
           setAvailableSemesters(sems.filter(s => s !== '0' && s !== 0));
           setAvailableResourceTypes(types);

           // Fetch syllabus for this year (if year selected but sem not)
           if (year && !semester) {
             try {
               const syl = await getNotes({ page: 0, size: 50, sort: 'latest', university, branch, year, resourceType: 'Syllabus' });
               setSyllabusNotes(syl.content || syl || []);
             } catch (e) {
               console.error('Failed to fetch syllabus', e);
               setSyllabusNotes([]);
             }
           } else {
             setSyllabusNotes([]);
           }

           // If all three (year, semester, resourceType) are selected, fetch subjects and notes
           if (year && semester && resourceType) {
             const subs = await getDistinctValues('subjectName', { university, branch, year, semester, resourceType });
             setAvailableSubjects(subs.filter(s => s !== 'Syllabus'));
             
             await fetchNotes(isPagination, { university, branch, year, semester, resourceType, subjectName: subjectFilter });
           } else {
             setNotes([]);
             setAvailableSubjects([]);
             setTotalPages(0);
           }
        }
      } else if (currentView === 'search' && searchQuery.trim()) {
         await fetchNotes(isPagination, {}, 'search');
      } else if (currentView === 'trending') {
         await fetchNotes(isPagination, {}, 'topRated');
      } else if (currentView === 'most_downloaded') {
         await fetchNotes(isPagination, {}, 'mostDownloaded');
      } else if (currentView === 'recently_uploaded') {
         await fetchNotes(isPagination, {}, 'latest');
      }
    } catch (err) {
      console.error(err);
      if (!isPagination) {
        setOptions([]);
        setNotes([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async (isPagination, filters = {}, sortOverride = null) => {
    const params = {
      page,
      size: 12,
      sort: sortOverride || 'latest',
      ...filters
    };
    
    let data;
    if (currentView === 'search' && searchQuery.trim()) {
      data = await searchNotes(searchQuery, params);
    } else {
      data = await getNotes(params);
    }

    if (data.content) {
      setNotes(isPagination ? [...notes, ...data.content] : data.content);
      setTotalPages(data.totalPages || 1);
    } else if (Array.isArray(data)) {
      setNotes(isPagination ? [...notes, ...data] : data);
      setTotalPages(1);
    } else {
      setNotes(isPagination ? notes : []);
      setTotalPages(0);
    }
  };

  const resetHierarchy = () => {
    setUniversity(null);
    setBranch(null);
    setYear(null);
    setSemester(null);
    setResourceType(null);
    setSubjectFilter(null);
    setSyllabusNotes([]);
  };

  const navigateTo = (view) => {
    setCurrentView(view);
    resetHierarchy();
    if (view === 'hierarchy') {
      setSearchQuery('');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setCurrentView('search');
    }
  };

  const renderBreadcrumbs = () => {
    if (currentView !== 'hierarchy') return null;
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-6 bg-white p-3 px-5 rounded-xl border border-gray-100 shadow-sm w-fit">
        <button onClick={() => navigateTo('home')} className="hover:text-primary-600 transition-colors font-medium">Home</button>
        {university && (
          <>
            <span className="text-gray-300">/</span>
            <button onClick={() => { setBranch(null); setYear(null); setSemester(null); setResourceType(null); setSubjectFilter(null); }} className="hover:text-primary-600 transition-colors font-medium">{university}</button>
          </>
        )}
        {branch && (
          <>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-semibold">{branch}</span>
          </>
        )}
      </div>
    );
  };

  const renderFolderGrid = () => {
    if (loading && options.length === 0 && !branch) return <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><NoteGridSkeleton count={4} /></div>;
    
    // Only show folder grid if university or branch is NOT selected
    if (university && branch) return null;

    if (!options || options.length === 0) {
      if (loading) return null;
      return (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 border-dashed">
          <p className="text-gray-500">No categories found</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => {
              if (!university) setUniversity(opt);
              else if (!branch) setBranch(opt);
            }}
            className="group flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all text-center"
          >
            <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-800 text-sm group-hover:text-primary-600 transition-colors">
              {opt}
            </span>
          </button>
        ))}
      </div>
    );
  };

  const renderSelectionPanel = () => {
    if (currentView !== 'hierarchy' || !branch) return null;
    
    return (
      <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Select Resource Criteria</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Year Selection */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Year</h4>
            {availableYears.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableYears.map(y => (
                  <button
                    key={y}
                    onClick={() => { setYear(y); setSubjectFilter(null); }}
                    className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                      year === y
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 border border-gray-100'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No years available</p>
            )}
          </div>

          {/* Semester Selection */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Semester</h4>
            {availableSemesters.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableSemesters.map(s => (
                  <button
                    key={s}
                    onClick={() => { setSemester(s); setSubjectFilter(null); }}
                    className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                      semester === s
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 border border-gray-100'
                    }`}
                  >
                    Sem {s}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Select Year first</p>
            )}
          </div>

          {/* Resource Type Selection */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Type</h4>
            {availableResourceTypes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableResourceTypes.map(t => (
                  <button
                    key={t}
                    onClick={() => { setResourceType(t); setSubjectFilter(null); }}
                    className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                      resourceType === t
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 border border-gray-100'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Select Year & Sem first</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSubjectFilter = () => {
    if (currentView !== 'hierarchy' || !branch || !year || !semester || !resourceType) return null;
    if (availableSubjects.length === 0) return null;

    return (
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filter by Subject (Optional)
        </h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSubjectFilter(null)}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              !subjectFilter
                ? 'bg-gray-800 text-white shadow-md'
                : 'text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm'
            }`}
          >
            All Subjects
          </button>
          {availableSubjects.map(sub => (
            <button
              key={sub}
              onClick={() => setSubjectFilter(sub)}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                subjectFilter === sub
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderNotesGrid = () => {
    if (loading && page === 0) return <NoteGridSkeleton count={8} />;
    
    if (notes.length === 0) {
      if (currentView === 'hierarchy' && (!year || !semester || !resourceType)) {
        return (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Make your selections</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Select a Year, Semester, and Resource Type above to view resources.
            </p>
          </div>
        );
      }

      return (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No files found</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            We couldn't find any documents here. Be the first to <a href="/upload" className="text-primary-600 hover:underline">upload one</a>!
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map((note, idx) => (
            <div key={note.id || note._id || idx}>
              <NoteCard note={note} />
            </div>
          ))}
        </div>
        {page < totalPages - 1 && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={loading}
              className="btn-secondary px-8 py-2.5"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-800 pt-16 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white opacity-5 blur-3xl mix-blend-overlay"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-primary-400 opacity-20 blur-3xl mix-blend-overlay"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
            Library
          </h1>
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-32 py-4 bg-white rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-primary-500/30 shadow-xl transition-all"
              placeholder="Search across all universities and branches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl px-6 transition-colors shadow-md hover:shadow-lg"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20 pb-20">
        
        {/* Navigation Cards */}
        {currentView === 'home' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { id: 'hierarchy', title: 'Browse Universities', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
              { id: 'trending', title: 'Trending', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
              { id: 'most_downloaded', title: 'Most Downloaded', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
              { id: 'recently_uploaded', title: 'Recently Uploaded', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
            ].map(nav => (
              <button
                key={nav.id}
                onClick={() => navigateTo(nav.id)}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 hover:-translate-y-1 transition-all flex flex-col items-center text-center group"
              >
                <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={nav.icon} />
                  </svg>
                </div>
                <span className="font-semibold text-gray-800">{nav.title}</span>
              </button>
            ))}
          </div>
        )}

        {/* Content Area */}
        <div className={currentView === 'home' ? 'hidden' : 'block'}>
          {renderBreadcrumbs()}
          
          <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
            <h2 className="text-2xl font-bold text-gray-900 capitalize flex items-center gap-2">
              {currentView === 'hierarchy' ? (branch ? branch : 'Select Category') : currentView.replace('_', ' ')}
            </h2>
            {currentView !== 'home' && currentView !== 'hierarchy' && (
              <button onClick={() => navigateTo('home')} className="text-sm font-medium text-gray-500 hover:text-primary-600 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                &larr; Back to Home
              </button>
            )}
          </div>

          {currentView === 'hierarchy' && !branch && renderFolderGrid()}

          {currentView === 'hierarchy' && branch && renderSelectionPanel()}

          {currentView === 'hierarchy' && branch && year && !semester && syllabusNotes.length > 0 && (
            <div className="mb-12">
              <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                Yearly Syllabus
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {syllabusNotes.map(note => <NoteCard key={note.id} note={note} />)}
              </div>
              <hr className="my-10 border-gray-200 border-dashed" />
            </div>
          )}

          {currentView === 'hierarchy' && branch && year && semester && resourceType && renderSubjectFilter()}
          
          {((currentView === 'hierarchy' && branch && year && semester && resourceType) || currentView !== 'hierarchy') && renderNotesGrid()}
        </div>
      </div>
    </div>
  );
};

export default NotesList;
