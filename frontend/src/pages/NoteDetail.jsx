import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getNoteById, toggleLike, recordDownload, getNotes, getNoteReviews, addNoteReview, reportNote, deleteNote } from '../api/notes';
import { getStudyProgress, toggleStudyProgress } from '../api/users';
import { archiveNote } from '../api/admin';
import { addRecentlyViewed } from '../utils/recentlyViewedUtils';
import { useAuth } from '../context/AuthContext';
import { forceDownload } from '../utils/cloudinary';
import NoteCard from '../components/NoteCard';

/**
 * Note Detail Page — full metadata, PDF/image preview, download, like, premium lock, reviews, related notes.
 */
const NoteDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfError, setPdfError] = useState(false);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // New features state
  const [completed, setCompleted] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [relatedNotes, setRelatedNotes] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    fetchNote();
  }, [id]);

  const fetchNote = async () => {
    setLoading(true);
    try {
      const data = await getNoteById(id);
      setNote(data);
      setLikesCount(data.likesCount || 0);
      // Support both "id" (Spring serialization) and "_id" (raw Mongo)
      const noteId = data.id || data._id;
      setLiked(data.likes?.includes(user?.id) || false);
      
      // Add to recently viewed
      addRecentlyViewed(data);

      // Fire related notes, reviews, and study progress in parallel
      const [relatedResult, reviewsResult, progressResult] = await Promise.allSettled([
        data.subject
          ? getNotes({ subject: data.subject, size: 4 }).then(res =>
              res.content?.filter(n => (n.id || n._id) !== noteId) || []
            )
          : Promise.resolve([]),
        getNoteReviews(noteId),
        isAuthenticated && user?.id
          ? getStudyProgress(user.id)
          : Promise.resolve([]),
      ]);

      setRelatedNotes(relatedResult.status === 'fulfilled' ? relatedResult.value : []);
      setReviews(reviewsResult.status === 'fulfilled' ? (reviewsResult.value || []) : []);
      if (progressResult.status === 'fulfilled' && Array.isArray(progressResult.value)) {
        setCompleted(progressResult.value.some(p => p.noteId === noteId && p.completed));
      }

    } catch (err) {
      console.error('Failed to fetch note:', err);
      toast.error('Note not found or failed to load');
    } finally {
      setLoading(false);
    }
  };

  // Fetch the PDF via JS to bypass Cloudinary's "Content-Disposition: attachment" header
  useEffect(() => {
    let objectUrl;
    if (note?.fileType === 'pdf' && note?.fileUrl && !note?.isPremium) {
      const loadPdf = async () => {
        try {
          // Because the backend now correctly appends .pdf to raw uploads, this fetch will work cleanly without 401s!
          const response = await fetch(note.fileUrl);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch PDF: ${response.statusText}`);
          }
          
          const rawBlob = await response.blob();
          // Explicitly set the MIME type so the iframe knows it's a PDF, bypassing Cloudinary's attachment header!
          const pdfBlob = new Blob([rawBlob], { type: 'application/pdf' });
          objectUrl = URL.createObjectURL(pdfBlob);
          
          setPdfUrl(objectUrl);
        } catch (err) {
          console.error('Failed to load PDF blob:', err);
          setPdfError(true);
        }
      };
      loadPdf();
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [note]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to like notes');
      return;
    }
    try {
      await toggleLike(id);
      setLiked(!liked);
      setLikesCount(liked ? likesCount - 1 : likesCount + 1);
    } catch (err) {
      toast.error('Failed to like note');
    }
  };

  const handleDownload = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to download notes');
      return;
    }

    // Check premium lock
    if (note?.isPremium) {
      toast.error('This is a premium note. Unlock with 50 points or subscribe!');
      return;
    }

    setDownloading(true);
    try {
      await recordDownload(id);
      const extension = note.fileType === 'pdf' ? 'pdf' : 'jpg';
      await forceDownload(note.fileUrl, `${note.title}.${extension}`);
      setNote({ ...note, downloads: (note.downloads || 0) + 1 });
      toast.success('Download complete!');
    } catch (err) {
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm("Are you sure you want to archive this note?")) return;
    try {
      await archiveNote(note.id || note._id);
      toast.success("Note archived successfully.");
      window.location.href = '/notes';
    } catch (err) {
      toast.error("Failed to archive note.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your pending upload? This cannot be undone.")) return;
    try {
      await deleteNote(note.id || note._id);
      toast.success("Upload deleted.");
      window.location.href = '/profile';
    } catch (err) {
      toast.error("Failed to delete note.");
    }
  };

  const handleToggleCompleted = async () => {
    if (!isAuthenticated) return toast.error('Please login to track progress');
    try {
      await toggleStudyProgress(user.id, note.id || note._id);
      setCompleted(!completed);
      toast.success(completed ? 'Marked as uncompleted' : 'Marked as completed!');
    } catch (e) {
      toast.error('Failed to update progress');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: note.title,
        text: `Check out these notes on ${note.subject}!`,
        url: url,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return toast.error('Please login to review');
    if (!reviewText.trim()) return;
    try {
      const newReview = await addNoteReview(note.id || note._id, { rating: reviewRating, comment: reviewText });
      setReviews([newReview, ...reviews]);
      setReviewText('');
      setReviewRating(5);
      toast.success('Review added!');
    } catch (e) {
      toast.error('Failed to add review');
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return toast.error('Please login to report');
    try {
      await reportNote(note.id || note._id, reportReason);
      setShowReportModal(false);
      setReportReason('');
      toast.success('Note reported successfully');
    } catch (e) {
      toast.error('Failed to report note');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse">
        <div className="skeleton h-8 w-2/3 mb-4 rounded" />
        <div className="skeleton h-4 w-1/3 mb-6 rounded" />
        <div className="skeleton h-96 rounded-2xl mb-6" />
        <div className="flex gap-4">
          <div className="skeleton h-10 w-32 rounded-xl" />
          <div className="skeleton h-10 w-32 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="text-center py-20 max-w-md mx-auto px-4">
        <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Note Not Found</h3>
        <p className="text-gray-500 text-sm mb-6">
          This note may have been deleted or the link is invalid.
        </p>
        <Link
          to="/notes"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-colors shadow-md"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Browse All Notes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <a href="/notes" className="hover:text-primary-600 transition-colors">Notes</a>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{note.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Title + badges */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-3">
              {note.isExamImportant && <span className="badge badge-yellow">⭐ Exam Important</span>}
              {note.verified && <span className="badge badge-blue">✓ Verified</span>}
              {note.downloads >= 100 && <span className="badge badge-green">🔥 Most Downloaded</span>}
              {note.isPremium && <span className="badge badge-purple">💎 Premium</span>}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{note.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span className="badge badge-purple">{note.branch || note.subject}</span>
              <span>Sem {note.semester}</span>
              <span>•</span>
              <span>{note.year}</span>
              {note.unit && (
                <>
                  <span>•</span>
                  <span>{note.unit}</span>
                </>
              )}
            </div>
          </div>

          {/* File Preview */}
          <div className="relative rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 mb-6">
            {note.isPremium && !note.unlocked ? (
              /* Premium lock overlay */
              <div className="relative">
                <div className="h-96 bg-gray-200 filter blur-sm" />
                <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Premium Content</h3>
                  <p className="text-gray-500 text-sm mb-4 max-w-xs text-center">
                    Unlock with 50 points or subscribe for unlimited access
                  </p>
                  <button className="btn-primary">
                    Unlock for 50 Points
                  </button>
                </div>
              </div>
            ) : note.fileType === 'pdf' ? (
              pdfUrl ? (
                <iframe
                  src={isMobile ? `https://docs.google.com/gview?url=${encodeURIComponent(note.fileUrl)}&embedded=true` : pdfUrl}
                  className="w-full h-[600px] border-0"
                  title={note.title}
                />
              ) : pdfError ? (
                <div className="flex flex-col items-center justify-center h-[600px] bg-gray-50 text-gray-500">
                  <svg className="w-12 h-12 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mb-4">Unable to generate a live preview.</p>
                  <button onClick={handleDownload} className="btn-primary text-sm px-4 py-2">
                    Download to View
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[600px] bg-gray-50 text-gray-500">
                  <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-sm">Loading high-quality PDF...</p>
                </div>
              )
            ) : (
              <img
                src={note.fileUrl}
                alt={note.title}
                className="w-full max-h-[600px] object-contain"
              />
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mb-8">
            {/* Like/Favorite button */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                liked
                  ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <svg className={`w-5 h-5 ${liked ? 'fill-red-500' : ''}`} fill={liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {likesCount} {likesCount === 1 ? 'Favorite' : 'Favorites'}
            </button>

            {/* Download button */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="btn-primary"
            >
              {downloading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              Download ({note.downloads || 0})
            </button>

            {/* Share button */}
            <button onClick={handleShare} className="btn-ghost">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              Share
            </button>

            {/* Report button */}
            <button onClick={() => setShowReportModal(true)} className="btn-ghost text-red-500 hover:bg-red-50 hover:text-red-600 ml-auto">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
            </button>

            {/* Admin Archive button */}
            {user?.role === 'ADMIN' && (
              <button onClick={handleArchive} className="btn-secondary border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 text-sm">
                Archive (Admin)
              </button>
            )}

            {/* Student Delete Pending Upload button */}
            {user?.id === note.uploadedBy && !note.verified && (
              <button onClick={handleDelete} className="btn-secondary border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 text-sm">
                Delete Upload
              </button>
            )}
          </div>

          {/* Study Progress section */}
          {isAuthenticated && (
            <div className={`glass-card p-4 mb-8 flex items-center justify-between border-l-4 ${completed ? 'border-l-green-500 bg-green-50' : 'border-l-primary-500'}`}>
              <div>
                <h3 className="font-bold text-gray-900">Study Progress</h3>
                <p className="text-sm text-gray-500">Track your completion of this unit.</p>
              </div>
              <button 
                onClick={handleToggleCompleted}
                className={`btn ${completed ? 'bg-green-500 text-white hover:bg-green-600' : 'btn-primary'}`}
              >
                {completed ? '✓ Completed' : 'Mark as Completed'}
              </button>
            </div>
          )}

          {/* Reviews Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ratings & Reviews</h2>
            
            {isAuthenticated ? (
              <form onSubmit={submitReview} className="glass-card p-6 mb-8">
                <h3 className="font-bold text-gray-900 mb-4">Write a Review</h3>
                <div className="flex gap-2 mb-4">
                  {[1,2,3,4,5].map(star => (
                    <button type="button" key={star} onClick={() => setReviewRating(star)} className={`text-2xl ${star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'}`}>
                      ★
                    </button>
                  ))}
                </div>
                <textarea 
                  className="input w-full h-24 mb-4" 
                  placeholder="What did you think of these notes?"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  required
                />
                <button type="submit" className="btn-primary">Submit Review</button>
              </form>
            ) : (
              <div className="glass-card p-6 mb-8 text-center bg-gray-50">
                <p className="text-gray-600 mb-4">Log in to leave a review</p>
                <Link to="/login" className="btn-primary">Log In</Link>
              </div>
            )}

            <div className="space-y-4">
              {reviews.length > 0 ? reviews.map(rev => (
                <div key={rev.id} className="border-b border-gray-100 pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{rev.userName}</p>
                      <div className="flex text-yellow-400 text-sm">
                        {'★'.repeat(rev.rating)}{'☆'.repeat(5-rev.rating)}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{rev.comment}</p>
                </div>
              )) : (
                <p className="text-gray-500">No reviews yet. Be the first!</p>
              )}
            </div>
          </div>

          {/* Related Notes Slider */}
          {relatedNotes.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Subjects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedNotes.map(rn => (
                  <NoteCard key={rn.id || rn._id} note={rn} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Uploader info */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Uploaded by</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-lg font-bold">
                {note.uploaderName?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{note.uploaderName || 'Anonymous'}</p>
                <p className="text-xs text-gray-500">{note.college}</p>
              </div>
            </div>
          </div>

          {/* Note details */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Details</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Subject</dt>
                <dd className="font-medium text-gray-900">{note.subject}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Semester</dt>
                <dd className="font-medium text-gray-900">{note.semester}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Year</dt>
                <dd className="font-medium text-gray-900">{note.year}</dd>
              </div>
              {note.unit && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Unit</dt>
                  <dd className="font-medium text-gray-900">{note.unit}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">File Type</dt>
                <dd className="font-medium text-gray-900 uppercase">{note.fileType}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Uploaded</dt>
                <dd className="font-medium text-gray-900">
                  {note.createdAt ? new Date(note.createdAt).toLocaleDateString('en-IN') : 'Unknown'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Stats card */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-xl bg-red-50">
                <p className="text-2xl font-bold text-red-600">{likesCount}</p>
                <p className="text-xs text-red-500">Likes</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-green-50">
                <p className="text-2xl font-bold text-green-600">{note.downloads || 0}</p>
                <p className="text-xs text-green-500">Downloads</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900">Report Note</h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {isAuthenticated ? (
              <form onSubmit={submitReport} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Reason for reporting</label>
                  <select 
                    className="input w-full mb-4"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    required
                  >
                    <option value="">Select a reason...</option>
                    <option value="Inaccurate content">Inaccurate content</option>
                    <option value="Wrong subject/semester">Wrong subject/semester</option>
                    <option value="Spam or inappropriate">Spam or inappropriate</option>
                    <option value="Copyright violation">Copyright violation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <button type="submit" className="btn bg-red-500 text-white hover:bg-red-600 w-full">Submit Report</button>
              </form>
            ) : (
              <div className="p-8 text-center space-y-4">
                <p className="text-gray-600">You must be logged in to report notes.</p>
                <Link to="/login" className="btn-primary w-full">Log In</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteDetail;
