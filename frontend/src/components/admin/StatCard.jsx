/**
 * StatCard — metric display card for the admin dashboard.
 */
const StatCard = ({ label, value, icon, color = 'primary', subtext }) => {
  const colorMap = {
    primary: 'from-primary-500 to-primary-700 shadow-primary-500/25',
    emerald: 'from-emerald-500 to-emerald-700 shadow-emerald-500/25',
    amber: 'from-amber-500 to-amber-700 shadow-amber-500/25',
    rose: 'from-rose-500 to-rose-700 shadow-rose-500/25',
    blue: 'from-blue-500 to-blue-700 shadow-blue-500/25',
  };

  return (
    <div className="glass-card p-5 hover-lift">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
          {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
        {icon && (
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center shadow-lg text-white`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
