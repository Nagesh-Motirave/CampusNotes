import { useState, useEffect } from 'react';
import { getNoteRequests, createNoteRequest } from '../api/notes';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const RequestsPage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    subject: '',
    semester: 1,
    description: ''
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getNoteRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load note requests', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createNoteRequest(formData);
      setShowModal(false);
      setFormData({ subject: '', semester: 1, description: '' });
      fetchRequests();
    } catch (err) {
      alert('Failed to submit request.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Note Requests</h1>
          <p className="text-gray-500 mt-1">Can't find what you're looking for? Request it here.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Request Notes
        </button>
      </div>

      {/* Requests List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-gray-500">Loading requests...</p>
        ) : requests.length > 0 ? (
          requests.map(req => (
            <div key={req.id} className="glass-card p-6 border-l-4 border-l-orange-400 relative">
              <div className="absolute top-4 right-4 badge bg-orange-100 text-orange-700">Open</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{req.subject}</h3>
              <p className="text-sm font-medium text-primary-600 mb-3">Semester {req.semester}</p>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{req.description}</p>
              <div className="text-xs text-gray-400 flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                <span>Requested by <span className="font-bold text-gray-700">{req.requesterName}</span></span>
                <span>{new Date(req.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 glass-card">
            <h3 className="text-lg font-bold text-gray-900">No open requests!</h3>
            <p className="text-gray-500 mt-2">Looks like everyone has the notes they need.</p>
          </div>
        )}
      </div>

      {/* Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900">Request Notes</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {user ? (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Subject Name</label>
                  <input 
                    type="text" 
                    required 
                    className="input w-full" 
                    placeholder="e.g. Data Structures"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Semester</label>
                  <select 
                    className="input w-full"
                    value={formData.semester}
                    onChange={(e) => setFormData({...formData, semester: Number(e.target.value)})}
                  >
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Description (Optional)</label>
                  <textarea 
                    className="input w-full h-24 resize-none" 
                    placeholder="Specify any particular topics, units, or professors..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full mt-4">Submit Request</button>
              </form>
            ) : (
              <div className="p-8 text-center space-y-4">
                <p className="text-gray-600">You must be logged in to request notes.</p>
                <Link to="/login" className="btn btn-primary w-full">Log In</Link>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default RequestsPage;
