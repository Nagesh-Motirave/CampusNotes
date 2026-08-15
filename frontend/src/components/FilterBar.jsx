/**
 * FilterBar — dropdown filters for notes listing.
 * Provides Year, Semester, Subject, and College filter dropdowns.
 */
const FilterBar = ({ filters, onChange }) => {
  const years = ['All Years', 'Diploma', 'Engineering'];
  const semesters = ['All Semesters', '1', '2', '3', '4', '5', '6', '7', '8'];


  const handleChange = (key, value) => {
    onChange({
      ...filters,
      [key]: value === `All ${key.charAt(0).toUpperCase() + key.slice(1)}s` || value.startsWith('All ') ? '' : value,
    });
  };

  const selectClass = `
    appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-5 py-2.5 pr-10 text-sm font-semibold text-slate-700 dark:text-slate-300
    focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent
    cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm
    bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20fill%3D%22%236B7280%22%20d%3D%22M7%207l3%203%203-3%22%2F%3E%3C%2Fsvg%3E')]
    bg-no-repeat bg-[position:right_0.75rem_center]
  `.trim();

  return (
    <div className="flex flex-wrap items-center gap-3 py-2 px-1">
      <div className="text-sm font-bold text-slate-400 mr-2 uppercase tracking-widest hidden md:block">Filter by</div>
      {/* Year filter */}
      <select
        value={filters.year || 'All Years'}
        onChange={(e) => handleChange('year', e.target.value)}
        className={selectClass}
        id="filter-year"
      >
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      {/* Semester filter */}
      <select
        value={filters.semester || 'All Semesters'}
        onChange={(e) => handleChange('semester', e.target.value)}
        className={selectClass}
        id="filter-semester"
      >
        {semesters.map((s) => (
          <option key={s} value={s}>{s === 'All Semesters' ? s : `Semester ${s}`}</option>
        ))}
      </select>



      {/* Clear filters */}
      {(filters.year || filters.semester || filters.subject) && (
        <button
          onClick={() => onChange({ year: '', semester: '', subject: '' })}
          className="text-sm text-brand hover:text-brand-dark font-bold flex items-center gap-1.5 transition-colors ml-auto bg-brand-light/10 px-4 py-2 rounded-full"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear All
        </button>
      )}
    </div>
  );
};

export default FilterBar;
