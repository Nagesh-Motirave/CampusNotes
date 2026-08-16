import { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { recordDownload } from '../api/notes';
import { useAuth } from '../context/AuthContext';
import { forceDownload } from '../utils/cloudinary';
import toast from 'react-hot-toast';

/**
 * NoteCard — displays a single note in the grid listing.
 * Shows title, subject badge, semester, college, uploader, likes, downloads.
 * Badges: "Exam Important" (yellow), "Verified" (blue), "Most Downloaded" (green).
 * Hover: slight lift shadow + download quick-action button.
 */
const NoteCard = ({ note }) => {
  const noteId = note.id || note._id;

  const {
    title,
    subject,
    semester,
    year,
    college,
    uploaderName,
    likesCount = 0,
    fileUrl,
    isExamImportant = false,
    verified = false,
    fileType = 'pdf',
    createdAt,
  } = note;

  const [downloads, setDownloads] = useState(note.downloads || 0);
  const [downloading, setDownloading] = useState(false);
  const { isAuthenticated } = useAuth();

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const handleQuickDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please login to download notes');
      return;
    }
    if (downloading) return;

    setDownloading(true);
    try {
      await recordDownload(noteId);
      const extension = fileType === 'pdf' ? 'pdf' : 'jpg';
      await forceDownload(fileUrl, `${title}.${extension}`);
      setDownloads((d) => d + 1);
      toast.success('Download complete!');
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  /** Generate a rich gradient pair from the subject string */
  const getSubjectGradient = (sub) => {
    const gradients = [
      { from: '#6366f1', to: '#8b5cf6', light: 'rgba(99,102,241,0.12)' },
      { from: '#06b6d4', to: '#3b82f6', light: 'rgba(6,182,212,0.12)' },
      { from: '#f59e0b', to: '#ef4444', light: 'rgba(245,158,11,0.12)' },
      { from: '#ec4899', to: '#8b5cf6', light: 'rgba(236,72,153,0.12)' },
      { from: '#10b981', to: '#14b8a6', light: 'rgba(16,185,129,0.12)' },
      { from: '#f97316', to: '#eab308', light: 'rgba(249,115,22,0.12)' },
    ];
    let hash = 0;
    for (let i = 0; i < (sub || '').length; i++) {
      hash = sub.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  const gradient = getSubjectGradient(subject);

  return (
    <Link
      to={`/notes/${noteId}`}
      className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 relative"
      style={{
        background: 'var(--card-bg, #ffffff)',
        border: '1px solid var(--card-border, rgba(226,232,240,0.8))',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 30px -4px ${gradient.from}30, 0 4px 16px rgba(0,0,0,0.06)`;
        e.currentTarget.style.borderColor = `${gradient.from}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)';
        e.currentTarget.style.borderColor = 'var(--card-border, rgba(226,232,240,0.8))';
      }}
    >
      {/* ── Gradient Header ── */}
      <div
        className="relative h-28 sm:h-32 w-full p-4 flex flex-col justify-between overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
      >
        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
          }}
        />

        {/* Top row — badges + file icon */}
        <div className="flex justify-between items-start z-10">
          <div className="flex flex-wrap gap-1.5">
            {isExamImportant && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-full shadow-sm"
                style={{ background: 'rgba(251,191,36,0.92)', color: '#78350f', backdropFilter: 'blur(8px)' }}>
                ⭐ IMP
              </span>
            )}
            {verified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-full shadow-sm"
                style={{ background: 'rgba(255,255,255,0.25)', color: '#ffffff', backdropFilter: 'blur(8px)' }}>
                ✓ Verified
              </span>
            )}
          </div>

          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)' }}>
            {fileType === 'pdf' ? (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 3.5L18.5 8H14V3.5zM10 13v4h1v-1.5h.5a1.5 1.5 0 000-3H10zm1 1h.5a.5.5 0 010 1H11v-1zm3 0v4h1.5a1.5 1.5 0 001.5-1.5v-1a1.5 1.5 0 00-1.5-1.5H14zm1 1h.5a.5.5 0 01.5.5v1a.5.5 0 01-.5.5H15v-2zM7 13v4h1v-1.5h1V14H8v-1h1.5v-1H7z" /></svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" /></svg>
            )}
          </div>
        </div>

        {/* Bottom row — semester/year pill */}
        <div className="z-10">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold text-white"
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)' }}>
            Sem {semester} • {year}
          </span>
        </div>

        {/* ── Download hover overlay ── */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
          style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(3px)' }}>
          <span className="w-11 h-11 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          </span>
          <button
            onClick={handleQuickDownload}
            disabled={downloading}
            className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300 disabled:opacity-50 hover:brightness-110"
            style={{ background: gradient.from, color: '#fff' }}
          >
            {downloading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Content Body ── */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">

        {/* Subject chip */}
        <span
          className="self-start inline-block px-3 py-1 rounded-lg text-[11px] font-bold tracking-wide mb-3"
          style={{ background: gradient.light, color: gradient.from }}
        >
          {subject || 'General'}
        </span>

        {/* Title */}
        <h3 className="text-[15px] sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-2 min-h-[40px] group-hover:text-primary-600 transition-colors duration-200"
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
          {title}
        </h3>

        {/* Branch / secondary line */}
        {(note.branch || college) && (
          <p className="text-[12px] text-slate-400 dark:text-slate-500 font-medium mt-1.5 truncate">
            {note.branch || college}
          </p>
        )}

        {/* ── Uploader + meta ── */}
        <div className="mt-auto pt-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ring-2"
              style={{
                background: `linear-gradient(135deg, ${gradient.from}20, ${gradient.to}20)`,
                color: gradient.from,
                ringColor: `${gradient.from}15`,
              }}
            >
              {uploaderName?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[90px]">
              {uploaderName || 'Anonymous'}
            </span>
          </div>

          <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
            {formatDate(createdAt)}
          </span>
        </div>

        {/* ── Stats row ── */}
        <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid rgba(226,232,240,0.6)' }}>
          <div className="flex items-center gap-1.5">
            <svg className="w-[15px] h-[15px] text-rose-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
            <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">{likesCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-[15px] h-[15px] text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">{downloads}</span>
          </div>
          <div className="ml-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate max-w-[100px] inline-block">
              {college}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default memo(NoteCard);
