import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/authAPI';

const AuthContext = createContext(null);

const TOKEN_KEY = 'civicsense_token';
const USER_KEY  = 'civicsense_user';

export const AuthProvider = ({ children }) => {
  const [user,          setUser]          = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  });
  const [token,         setToken]         = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading,       setLoading]       = useState(true);

  // Validate token on mount
  useEffect(() => {
    const init = async () => {
      if (token) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data);
          localStorage.setItem(USER_KEY, JSON.stringify(res.data));
        } catch {
          // Token invalid / expired
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    init();
  }, []); // only on mount

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { user: u, token: t } = res.data;
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setToken(t);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authAPI.register(data);
    const { user: u, token: t } = res.data;
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setToken(t);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updated) => {
    setUser(updated);
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
