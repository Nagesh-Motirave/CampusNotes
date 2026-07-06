import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser } from '../api/auth';

/**
 * AuthContext provides global authentication state.
 * Manages JWT token storage, user info, login/logout/register methods.
 */
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Sync role dynamically from backend without requiring re-login
        import('../api/users').then(({ getUserProfile }) => {
          getUserProfile(parsedUser.id)
            .then(freshData => {
              if (freshData && freshData.role) {
                try {
                  const payload = JSON.parse(atob(token.split('.')[1]));
                  const tokenRole = payload.role || 'USER';
                  if (freshData.role !== tokenRole) {
                    // If the role in DB differs from the token (e.g., promoted to ADMIN), the JWT is stale.
                    alert('Your account permissions have been updated. Please log in again to apply changes.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    return;
                  }
                } catch (e) {
                  console.error('Error decoding token', e);
                }

                if (!parsedUser.role || freshData.role !== parsedUser.role) {
                  const updatedUser = { ...parsedUser, role: freshData.role };
                  setUser(updatedUser);
                  localStorage.setItem('user', JSON.stringify(updatedUser));
                }
              }
            })
            .catch(err => console.error('Failed to sync user role', err));
        });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  /** Login with email + password, stores JWT and user info */
  const login = useCallback(async (credentials) => {
    const data = await loginUser(credentials);
    console.log('[AuthContext] Login response from backend:', JSON.stringify(data));
    const { token: jwt, ...userData } = data;
    console.log('[AuthContext] Stored user data:', JSON.stringify(userData));
    console.log('[AuthContext] User role:', userData.role);
    localStorage.setItem('token', jwt);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(jwt);
    setUser(userData);
    return data;
  }, []);

  /** Register a new account, then auto-login */
  const register = useCallback(async (formData) => {
    const data = await registerUser(formData);
    const { token: jwt, ...userData } = data;
    localStorage.setItem('token', jwt);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(jwt);
    setUser(userData);
    return data;
  }, []);

  /** Logout — clear token and user state */
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  /** Check if user is authenticated */
  const isAuthenticated = !!token && !!user;

  /** Check if user has admin role */
  const isAdmin = !!(user?.role && user.role.toUpperCase() === 'ADMIN');

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
