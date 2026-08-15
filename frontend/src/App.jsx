import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Lazy-loaded pages — each is code-split into its own chunk
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const NotesList = lazy(() => import('./pages/NotesList'));
const NoteDetail = lazy(() => import('./pages/NoteDetail'));
const UploadNote = lazy(() => import('./pages/UploadNote'));
const RequestsPage = lazy(() => import('./pages/RequestsPage'));
const Profile = lazy(() => import('./pages/Profile'));
const RequestNotes = lazy(() => import('./pages/RequestNotes'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-300">
          <Navbar />
          
          <main className="flex-1">
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            }>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/notes" element={<NotesList />} />
              <Route path="/notes/:id" element={<NoteDetail />} />
              <Route path="/requests" element={<RequestsPage />} />

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
            </Suspense>
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
