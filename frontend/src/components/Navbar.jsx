import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markNotificationsRead } from '../api/users';

/**
 * Navbar — top navigation bar with logo, search, upload button, profile avatar, login/logout.
 * Fully responsive with mobile hamburger menu.
 */
const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch notifications periodically
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await getNotifications(user.id);
      setNotifications(data);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  }, [user?.id]);

  const handleMarkNotificationsRead = async () => {
    if (notifications.some(n => !n.read)) {
      try {
        await markNotificationsRead(user.id);
        fetchNotifications();
      } catch (e) {
        console.error("Failed to mark notifications read", e);
      }
    }
  };



  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  /** Generate initials from user name */
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/logo.jpg" alt="Campus Notes Hub" className="w-10 h-10 rounded-full object-cover shadow-sm group-hover:shadow-md transition-all border border-gray-100" />
            <span className="text-lg font-bold text-gray-900 hidden sm:block">
              Campus<span className="text-primary-600">Notes</span>
            </span>
          </Link>



          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/notes" className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors px-3 py-2">
              Browse
            </Link>

            {isAuthenticated ? (
              <>
                <Link to="/requests" className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors px-3 py-2">
                  Requests
                </Link>

                {/* Notifications Bell */}
                <div className="relative group">
                  <button 
                    onClick={() => { setShowNotifications(!showNotifications); handleMarkNotificationsRead(); }}
                    className="p-2 text-gray-500 hover:text-primary-600 transition-colors relative"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    {notifications.some(n => !n.read) && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                    )}
                  </button>
                  
                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20">
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                          <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length > 0 ? (
                            notifications.map(notif => (
                              <Link 
                                key={notif.id} 
                                to={notif.link || '#'} 
                                onClick={() => setShowNotifications(false)}
                                className={`block px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-primary-50/50' : ''}`}
                              >
                                <p className="text-sm text-gray-800">{notif.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(notif.date).toLocaleDateString()}</p>
                              </Link>
                            ))
                          ) : (
                            <div className="px-4 py-6 text-center text-gray-500 text-sm">
                              No new notifications
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <Link to="/upload" className="btn-primary text-sm py-2 px-4 ml-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Upload
                </Link>

                {/* Profile Avatar */}
                <div className="relative group">
                  <button className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm flex items-center justify-center hover:bg-primary-200 transition-colors ring-2 ring-primary-500/20">
                    {getInitials(user?.name)}
                  </button>
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        Profile
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" className="block px-4 py-2 text-sm text-primary-600 font-medium hover:bg-primary-50 transition-colors">
                          Admin Analytics Dashboard
                        </Link>
                      )}
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm py-2 px-4">
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white animate-fade-in">

          <div className="px-4 pb-4 space-y-1">
            <Link to="/notes" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50">
              Browse Notes
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/upload" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50">
                  Upload Note
                </Link>
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50">
                  Profile
                </Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-primary-600 font-medium hover:bg-primary-50">
                    Admin Analytics Dashboard
                  </Link>
                )}
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-red-600 hover:bg-red-50">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50">
                  Login
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-primary-600 font-medium hover:bg-primary-50">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
