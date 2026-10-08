import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, getCurrentUser } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // On mount, if a token exists, verify it's still valid and load the user.
  useEffect(() => {
    const token = localStorage.getItem('trippal_token');
    if (!token) {
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem('trippal_token');
        localStorage.removeItem('trippal_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const data = await loginUser({ email, password });
      localStorage.setItem('trippal_token', data.token);
      localStorage.setItem('trippal_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const register = useCallback(async (payload) => {
    setError(null);
    try {
      const data = await registerUser(payload);
      localStorage.setItem('trippal_token', data.token);
      localStorage.setItem('trippal_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('trippal_token');
    localStorage.removeItem('trippal_user');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const data = await getCurrentUser();
    setUser(data.user);
    localStorage.setItem('trippal_user', JSON.stringify(data.user));
    return data.user;
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};