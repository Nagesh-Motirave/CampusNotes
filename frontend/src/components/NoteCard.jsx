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
  // Spring Boot serializes @Id as "id"; Mongo shell uses "_id" — support both
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

  /** Format date to relative string */
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

  /** Handle quick-download from card hover button */
  const handleQuickDownload = async (e) => {
    // Prevent the Link from navigating to the detail page
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

  return (
    <Link to={`/notes/${noteId}`} className="group block">
      <div className="bg-gradient-to-br from-white/95 to-primary-50/20 dark:from-gray-900/95 dark:to-primary-900/10 backdrop-blur-xl border border-white/80 dark:border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-2xl p-5 cursor-pointer relative overflow-hidden transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] dark:group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] group-hover:border-primary-200 dark:group-hover:border-primary-800">
        {/* File type icon in corner */}
        <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
          {fileType === 'pdf' ? (
            <svg className="w-16 h-16 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 3.5L18.5 8H14V3.5zM10 13v4h1v-1.5h.5a1.5 1.5 0 000-3H10zm1 1h.5a.5.5 0 010 1H11v-1zm3 0v4h1.5a1.5 1.5 0 001.5-1.5v-1a1.5 1.5 0 00-1.5-1.5H14zm1 1h.5a.5.5 0 01.5.5v1a.5.5 0 01-.5.5H15v-2zM7 13v4h1v-1.5h1V14H8v-1h1.5v-1H7z" />
            </svg>
          ) : (
            <svg className="w-16 h-16 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
          )}
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {isExamImportant && (
            <span className="badge badge-yellow">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Exam Important
            </span>
          )}
          {verified && (
            <span className="badge badge-blue">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified
            </span>
          )}
          {downloads >= 100 && (
            <span className="badge badge-green">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
              Most Downloaded
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {title}
        </h3>

        {/* Subject + Semester tag */}
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
          <span className="badge badge-purple">{note.branch || subject}</span>
          <span>Sem {semester} • {year}</span>
        </div>

        {/* Meta info */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-bold">
              {uploaderName?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="truncate max-w-[80px]">{uploaderName || 'Anonymous'}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Likes */}
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <span>{likesCount}</span>
            </div>
            {/* Downloads */}
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>{downloads}</span>
            </div>
          </div>
        </div>

        {/* College + time */}
        <div className="flex items-center justify-between mt-2 text-[11px] text-gray-400">
          <span className="truncate max-w-[120px]">{college}</span>
          <span>{formatDate(createdAt)}</span>
        </div>

        {/* Hover download button — stops propagation so Link doesn't fire */}
        <button
          onClick={handleQuickDownload}
          disabled={downloading}
          aria-label="Quick download"
          className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0"
        >
          <div className={`w-9 h-9 rounded-full text-white flex items-center justify-center shadow-lg shadow-primary-500/40 transition-colors ${
            downloading ? 'bg-primary-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'
          }`}>
            {downloading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
          </div>
        </button>
      </div>
    </Link>
  );
};

export default NoteCard;
