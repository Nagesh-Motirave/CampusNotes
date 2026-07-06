/**
 * SimpleBarChart — lightweight CSS bar chart (no external chart library).
 */
const SimpleBarChart = ({ data, labelKey = 'date', valueKey = 'count', title }) => {
  if (!data?.length) {
    return (
      <div className="text-center py-8 text-sm text-gray-400">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);

  return (
    <div>
      {title && <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>}
      <div className="flex items-end gap-1.5 h-40">
        {data.map((item, i) => {
          const value = Number(item[valueKey]) || 0;
          const height = `${Math.max((value / maxValue) * 100, 4)}%`;
          const label = String(item[labelKey] || '');
          const shortLabel = label.includes('-') ? label.slice(5) : label;

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0 group">
              <span className="text-[10px] font-medium text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                {value}
              </span>
              <div className="w-full flex items-end justify-center flex-1">
                <div
                  className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-primary-600 to-primary-400 transition-all duration-300 group-hover:from-primary-700 group-hover:to-primary-500"
                  style={{ height }}
                  title={`${label}: ${value}`}
                />
              </div>
              <span className="text-[9px] text-gray-400 truncate w-full text-center" title={label}>
                {shortLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SimpleBarChart;
