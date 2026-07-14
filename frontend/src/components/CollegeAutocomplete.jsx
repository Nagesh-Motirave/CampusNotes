import { useState, useEffect, useRef, useCallback } from 'react';
import { searchColleges } from '../api/colleges';
import { FiBookOpen, FiCheck, FiSearch } from 'react-icons/fi';

/**
 * CollegeAutocomplete — Searchable dropdown for college selection.
 *
 * Features:
 * - Debounced search (300ms) against officialName, shortName, aliases
 * - Displays official college name with status badge
 * - Allows selecting existing college (sets collegeId) or typing a new one
 * - Reusable across Register, Profile edit, and Upload forms
 *
 * Props:
 *   - value: string (current display text)
 *   - onChange: (college) => void — called with { name, id } when selected or typed
 *   - error: boolean — highlight input border in red
 *   - placeholder: string
 *   - inputId: string — HTML id for the input
 *   - inputClassName: string — additional classes for the input
 *   - disabled: boolean
 */
const CollegeAutocomplete = ({
  value = '',
  onChange,
  error = false,
  placeholder = 'Search or type college name',
  inputId = 'college-autocomplete',
  inputClassName = '',
  disabled = false,
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  const doSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await searchColleges(searchQuery.trim());
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('College search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setIsOpen(true);
    setSelectedIndex(-1);

    // Notify parent with raw text (no collegeId yet)
    if (onChange) {
      onChange({ name: newValue, id: null });
    }

    // Debounce search
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(newValue), 300);
  };

  const handleSelect = (college) => {
    setQuery(college.officialName);
    setIsOpen(false);
    setSelectedIndex(-1);
    if (onChange) {
      onChange({ name: college.officialName, id: college.id });
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleFocus = () => {
    if (query && query.trim().length >= 2) {
      doSearch(query);
      setIsOpen(true);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <FiBookOpen className="w-4.5 h-4.5 text-gray-400" />
        </div>
        <input
          id={inputId}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          disabled={disabled}
          autoComplete="off"
          className={`input-field pl-10 pr-10 ${error ? 'border-red-400 focus:ring-red-500' : ''} ${inputClassName}`}
          placeholder={placeholder}
        />
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
          {loading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
          ) : (
            <FiSearch className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto animate-slide-up">
          {results.map((college, index) => (
            <button
              key={college.id}
              type="button"
              onClick={() => handleSelect(college)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0 ${
                index === selectedIndex
                  ? 'bg-primary-50 text-primary-700'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  college.status === 'Verified'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {college.officialName?.charAt(0)?.toUpperCase() || '?'}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{college.officialName}</p>
                {college.shortName && college.shortName !== college.officialName && (
                  <p className="text-xs text-gray-400 truncate">{college.shortName}</p>
                )}
              </div>
              <div className="flex-shrink-0 flex items-center gap-1.5">
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                  college.status === 'Verified'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {college.status}
                </span>
                {query.toLowerCase() === college.officialName?.toLowerCase() && (
                  <FiCheck className="w-4 h-4 text-green-500" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* "No results" hint */}
      {isOpen && !loading && query.trim().length >= 2 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center">
          <p className="text-sm text-gray-500">
            No matching college found. A new entry will be created.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            It will be marked as "Pending" until admin approves it.
          </p>
        </div>
      )}
    </div>
  );
};

export default CollegeAutocomplete;
