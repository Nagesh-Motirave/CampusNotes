import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import NotesList from './pages/NotesList';
import NoteDetail from './pages/NoteDetail';
import UploadNote from './pages/UploadNote';
import RequestsPage from './pages/RequestsPage';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import RequestNotes from './pages/RequestNotes';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
          <Navbar />
          
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/notes" element={<NotesList />} />
              <Route path="/notes/:id" element={<NoteDetail />} />
              <Route path="/requests" element={<RequestsPage />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/request-notes" element={<RequestNotes />} />

              {/* Protected Routes */}
              <Route path="/upload" element={
                <ProtectedRoute>
                  <UploadNote />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
            </Routes>
          </main>

          <Toaster 
            position="bottom-right"
            toastOptions={{
              className: 'font-sans text-sm font-medium',
              style: {
                borderRadius: '12px',
                background: '#333',
                color: '#fff',
              },
              success: {
                style: { background: '#10B981' }
              },
              error: {
                style: { background: '#EF4444' }
              }
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
