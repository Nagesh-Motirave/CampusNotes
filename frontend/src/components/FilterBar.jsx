/**
 * FilterBar — dropdown filters for notes listing.
 * Provides Year, Semester, Subject, and College filter dropdowns.
 */
const FilterBar = ({ filters, onChange }) => {
  const years = ['All Years', 'Diploma', 'Engineering'];
  const semesters = ['All Semesters', '1', '2', '3', '4', '5', '6', '7', '8'];
  const subjects = [
    'All Subjects', 'Mathematics', 'Physics', 'Chemistry', 'Computer Science',
    'Electronics', 'Mechanical', 'Civil', 'Electrical', 'DBMS', 'OS',
    'Data Structures', 'Networking', 'Software Engineering', 'AI/ML',
  ];

  const handleChange = (key, value) => {
    onChange({
      ...filters,
      [key]: value === `All ${key.charAt(0).toUpperCase() + key.slice(1)}s` || value.startsWith('All ') ? '' : value,
    });
  };

  const selectClass = `
    appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-8 text-sm text-gray-700
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
    cursor-pointer hover:border-gray-300 transition-all
    bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20fill%3D%22%236B7280%22%20d%3D%22M7%207l3%203%203-3%22%2F%3E%3C%2Fsvg%3E')]
    bg-no-repeat bg-[position:right_0.5rem_center]
  `.trim();

  return (
    <div className="flex flex-wrap items-center gap-3 py-4">
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

      {/* Subject filter */}
      <select
        value={filters.subject || 'All Subjects'}
        onChange={(e) => handleChange('subject', e.target.value)}
        className={selectClass}
        id="filter-subject"
      >
        {subjects.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* College text input */}
      <input
        type="text"
        value={filters.college || ''}
        onChange={(e) => onChange({ ...filters, college: e.target.value })}
        placeholder="Filter by college..."
        className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent hover:border-gray-300 transition-all w-full sm:w-48"
        id="filter-college"
      />

      {/* Clear filters */}
      {(filters.year || filters.semester || filters.subject || filters.college) && (
        <button
          onClick={() => onChange({ year: '', semester: '', subject: '', college: '' })}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
      )}
    </div>
  );
};

export default FilterBar;
