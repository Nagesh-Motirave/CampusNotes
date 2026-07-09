import { useState } from 'react';
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

  const getSubjectColor = (sub) => {
    const colors = [
      'from-blue-500 to-indigo-600',
      'from-emerald-400 to-teal-500',
      'from-orange-400 to-red-500',
      'from-purple-500 to-pink-600',
      'from-cyan-400 to-blue-500',
      'from-amber-400 to-orange-500'
    ];
    let hash = 0;
    for (let i = 0; i < (sub || '').length; i++) {
      hash = sub.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Link to={`/notes/${noteId}`} className="group flex flex-col bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative">
      
      {/* Thumbnail Section */}
      <div className={`relative h-40 w-full bg-gradient-to-br ${getSubjectColor(subject)} p-4 flex flex-col justify-between overflow-hidden`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%222%22%20cy%3D%222%22%20r%3D%222%22%20fill%3D%22%23fff%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px]" />
        
        {/* Top Badges */}
        <div className="flex justify-between items-start z-10">
          <div className="flex flex-col gap-1.5">
            {isExamImportant && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-400/90 text-yellow-900 text-[10px] font-bold rounded shadow-sm backdrop-blur-md">
                ⭐ IMP
              </span>
            )}
            {verified && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/90 text-white text-[10px] font-bold rounded shadow-sm backdrop-blur-md">
                ✓ VERIFIED
              </span>
            )}
          </div>
          
          <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-sm">
            {fileType === 'pdf' ? (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 3.5L18.5 8H14V3.5zM10 13v4h1v-1.5h.5a1.5 1.5 0 000-3H10zm1 1h.5a.5.5 0 010 1H11v-1zm3 0v4h1.5a1.5 1.5 0 001.5-1.5v-1a1.5 1.5 0 00-1.5-1.5H14zm1 1h.5a.5.5 0 01.5.5v1a.5.5 0 01-.5.5H15v-2zM7 13v4h1v-1.5h1V14H8v-1h1.5v-1H7z" /></svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" /></svg>
            )}
          </div>
        </div>

        {/* Thumbnail Title/Subject */}
        <div className="z-10">
          <h4 className="text-white font-bold text-lg leading-tight truncate">{subject || 'Notes'}</h4>
          <p className="text-white/80 text-xs mt-1">Sem {semester} • {year}</p>
        </div>

        {/* Hover Actions Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 z-20">
          <span className="w-10 h-10 rounded-full bg-white text-gray-900 flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          </span>
          <button 
            onClick={handleQuickDownload}
            disabled={downloading}
            className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
          >
            {downloading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col bg-white dark:bg-gray-900">
        <h3 className="text-gray-900 dark:text-white font-bold text-base mb-1 line-clamp-2 min-h-[40px] group-hover:text-primary-600 transition-colors">
          {title}
        </h3>
        
        <p className="text-xs text-gray-500 mb-3 truncate">
          {note.branch || subject}
        </p>

        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold shadow-inner">
              {uploaderName?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="truncate max-w-[80px] font-medium">{uploaderName || 'Anonymous'}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
              <span className="font-medium text-gray-700 dark:text-gray-300">{likesCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span className="font-medium text-gray-700 dark:text-gray-300">{downloads}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 text-[10px] text-gray-400 font-medium">
          <span className="truncate max-w-[120px]">{college}</span>
          <span>{formatDate(createdAt)}</span>
        </div>
      </div>
    </Link>
  );
};

export default NoteCard;
