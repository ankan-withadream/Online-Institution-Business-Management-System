import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Validate stored session instead of blindly trusting localStorage
    var storedUser = localStorage.getItem('user');
    var accessToken = localStorage.getItem('accessToken');

    if (storedUser && accessToken) {
      // Verify the token is still valid
      api.get('/auth/me')
        .then(function () {
          setUser(JSON.parse(storedUser));
          setLoading(false);
        })
        .catch(function () {
          // Token expired — try refresh
          var refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            throw new Error('No refresh token');
          }
          return api.post('/auth/refresh', { refreshToken: refreshToken });
        })
        .then(function (refreshRes) {
          if (refreshRes) {
            localStorage.setItem('accessToken', refreshRes.data.accessToken);
            localStorage.setItem('refreshToken', refreshRes.data.refreshToken);
            setUser(JSON.parse(storedUser));
          }
          setLoading(false);
        })
        .catch(function () {
          // Both tokens dead — clean up
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setUser(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (email, password, fullName, role = 'student') => {
    const { data } = await api.post('/auth/register', { email, password, fullName, role });
    return data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  const forgotPassword = async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    forgotPassword,
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student',
    isFranchise: user?.role === 'franchise',
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
