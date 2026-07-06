/**
 * LoadingSkeleton — skeleton loading placeholders for note cards and other content.
 * Used to display a shimmer effect while data is loading.
 */

/** Skeleton for a single NoteCard */
export const NoteCardSkeleton = () => (
  <div className="glass-card p-5 animate-pulse">
    <div className="flex gap-2 mb-3">
      <div className="skeleton h-5 w-24 rounded-full" />
      <div className="skeleton h-5 w-16 rounded-full" />
    </div>
    <div className="skeleton h-5 w-3/4 mb-2 rounded" />
    <div className="skeleton h-4 w-1/2 mb-3 rounded" />
    <div className="flex items-center gap-2 mb-3">
      <div className="skeleton h-5 w-20 rounded-full" />
      <div className="skeleton h-4 w-24 rounded" />
    </div>
    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
      <div className="flex items-center gap-2">
        <div className="skeleton w-5 h-5 rounded-full" />
        <div className="skeleton h-3 w-16 rounded" />
      </div>
      <div className="flex gap-3">
        <div className="skeleton h-3 w-8 rounded" />
        <div className="skeleton h-3 w-8 rounded" />
      </div>
    </div>
  </div>
);

/** Grid of NoteCard skeletons */
export const NoteGridSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <NoteCardSkeleton key={i} />
    ))}
  </div>
);

/** Skeleton for profile page stats */
export const ProfileSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="flex items-center gap-4">
      <div className="skeleton w-20 h-20 rounded-full" />
      <div className="space-y-2">
        <div className="skeleton h-6 w-40 rounded" />
        <div className="skeleton h-4 w-24 rounded" />
      </div>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton h-24 rounded-xl" />
      ))}
    </div>
  </div>
);

/** Generic line skeleton */
export const LineSkeleton = ({ width = 'w-full', height = 'h-4' }) => (
  <div className={`skeleton ${width} ${height} rounded`} />
);

export default { NoteCardSkeleton, NoteGridSkeleton, ProfileSkeleton, LineSkeleton };
