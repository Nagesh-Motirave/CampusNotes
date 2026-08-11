import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markNotificationsRead } from '../api/users';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try { setNotifications(await getNotifications(user.id)); }
    catch (e) { console.error('Failed to fetch notifications', e); }
  }, [user?.id]);

  const handleMarkNotificationsRead = async () => {
    if (notifications.some(n => !n.read)) {
      try { await markNotificationsRead(user.id); fetchNotifications(); }
      catch (e) { console.error('Failed to mark notifications read', e); }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const getInitials = (name) => !name ? '?' : name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 shadow-[0_1px_12px_rgba(15,23,42,.04)]">
      <div className="student-section">
        <div className="flex items-center justify-between h-[68px]">
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative">
              <img src="/logo.jpg" alt="Campus Notes Hub" className="w-10 h-10 rounded-xl object-cover shadow-sm ring-1 ring-slate-200 group-hover:scale-105 transition-transform" />
              <span className="absolute -right-1 -bottom-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-950" />
            </div>
            <div className="hidden sm:block">
              <div className="text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white">Campus<span className="text-indigo-600">Notes</span></div>
              <div className="text-[10px] font-semibold text-slate-400 tracking-wide">STUDY • SHARE • GROW</div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors">Home</Link>
            <Link to="/notes" className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors">Browse Notes</Link>

            {isAuthenticated && (
              <Link to="/requests" className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors">Requests</Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-2 ml-3 pl-3 border-l border-slate-200 dark:border-slate-800">
                <div className="relative">
                  <button
                    onClick={() => { setShowNotifications(!showNotifications); handleMarkNotificationsRead(); }}
                    className="relative w-10 h-10 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-900 transition-colors flex items-center justify-center"
                    aria-label="Notifications"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    {notifications.some(n => !n.read) && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-950" />}
                  </button>
                  {showNotifications && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                      <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-20">
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">Updates</span>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length ? notifications.map(notif => (
                            <Link key={notif.id} to={notif.link || '#'} onClick={() => setShowNotifications(false)} className={`block px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${!notif.read ? 'bg-indigo-50/60 dark:bg-indigo-950/30' : ''}`}>
                              <p className="text-sm text-slate-800 dark:text-slate-200">{notif.message}</p>
                              <p className="text-xs text-slate-400 mt-1">{new Date(notif.date).toLocaleDateString()}</p>
                            </Link>
                          )) : <div className="px-4 py-8 text-center text-slate-500 text-sm">You're all caught up 🎉</div>}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <Link to="/upload" className="btn-primary py-2.5 px-4 shadow-md">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Share Notes
                </Link>

                <div className="relative group ml-1">
                  <button className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-sm flex items-center justify-center ring-1 ring-indigo-100 dark:ring-indigo-900 hover:ring-indigo-300 transition-all">
                    {getInitials(user?.name)}
                  </button>
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right overflow-hidden">
                    <div className="px-4 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
                    </div>
                    <div className="p-1.5">
                      <Link to="/profile" className="block px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">My Profile</Link>
                      {isAdmin && <Link to="/admin" className="block px-3 py-2.5 rounded-xl text-sm text-indigo-600 hover:bg-indigo-50">Admin Analytics</Link>}
                      <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-rose-600 hover:bg-rose-50">Log out</button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-3 pl-3 border-l border-slate-200 dark:border-slate-800">
                <Link to="/login" className="btn-ghost py-2 px-3.5">Log in</Link>
                <Link to="/register" className="btn-primary py-2.5 px-4">Get Started</Link>
              </div>
            )}
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden w-10 h-10 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900 flex items-center justify-center" aria-label="Open menu">
            {mobileMenuOpen
              ? <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              : <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 animate-fade-in">
          <div className="student-section py-4 space-y-1">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-900">🏠 Home</Link>
            <Link to="/notes" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-900">📚 Browse Notes</Link>
            {isAuthenticated && <>
              <Link to="/requests" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-900">🙋 Request Notes</Link>
              <Link to="/upload" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-semibold text-indigo-700 bg-indigo-50 dark:bg-indigo-950/50">➕ Share Notes</Link>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-900">👤 My Profile</Link>
              {isAdmin && <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-semibold text-indigo-600 hover:bg-indigo-50">📊 Admin Analytics</Link>}
              <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50">↪ Log out</button>
            </>}
            {!isAuthenticated && <>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50">Log in</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600">Get Started</Link>
            </>}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
