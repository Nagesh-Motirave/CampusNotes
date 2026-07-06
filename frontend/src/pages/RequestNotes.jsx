import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { getNoteRequests, createNoteRequest } from '../api/notes';
import { useAuth } from '../context/AuthContext';

/**
 * Request Notes Page — list of open requests and a form to submit a new request.
 */
const RequestNotes = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await getNoteRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to request notes');
      return;
    }
    setSubmitting(true);
    try {
      const newRequest = await createNoteRequest(data);
      setRequests([newRequest, ...requests]);
      toast.success('Note request submitted!');
      reset();
    } catch (err) {
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Request a Note</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Can't find the notes you need? Ask the community! Fulfilling a request earns you bonus points.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Request Form */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Submit Request</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Operating Systems"
                  {...register('subject', { required: 'Subject is required' })}
                />
                {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Semester</label>
                <select
                  className="input-field"
                  {...register('semester', { required: 'Semester is required' })}
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.semester && <p className="text-red-500 text-xs mt-1">{errors.semester.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description / Specific Topic</label>
                <textarea
                  className="input-field resize-none h-24"
                  placeholder="e.g. Need handwritten notes for Unit 3 (Memory Management)"
                  {...register('description', { required: 'Description is required' })}
                ></textarea>
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full"
              >
                {submitting ? 'Submitting...' : 'Post Request'}
              </button>
            </form>
          </div>
        </div>

        {/* Requests List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Open Requests ({requests.length})</h2>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-card p-5 animate-pulse">
                  <div className="skeleton h-5 w-40 mb-2 rounded" />
                  <div className="skeleton h-4 w-full mb-3 rounded" />
                  <div className="skeleton h-4 w-24 rounded" />
                </div>
              ))}
            </div>
          ) : requests.length > 0 ? (
            requests.map(req => (
              <div key={req._id || req.id} className="glass-card p-5 border-l-4 border-l-primary-500">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{req.subject}</h3>
                  <span className="badge badge-purple">Sem {req.semester}</span>
                </div>
                <p className="text-gray-600 text-sm mb-3">{req.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {req.requesterName || 'Student'}
                  </span>
                  <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 glass-card">
              <p className="text-gray-500">No open requests right now.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestNotes;
