import { createContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedBusiness = localStorage.getItem('business');
    const accessToken = localStorage.getItem('accessToken');

    if (storedUser && accessToken) {
      setUser(JSON.parse(storedUser));
      if (storedBusiness) setBusiness(JSON.parse(storedBusiness));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    const { user: userData, business: bizData, accessToken, refreshToken } = data.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    if (bizData) localStorage.setItem('business', JSON.stringify(bizData));

    setUser(userData);
    setBusiness(bizData);
    return data;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authAPI.register(formData);
    const { user: userData, business: bizData, accessToken, refreshToken } = data.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    if (bizData) localStorage.setItem('business', JSON.stringify(bizData));

    setUser(userData);
    setBusiness(bizData);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) await authAPI.logout(refreshToken);
    } catch {
      // ignore logout API errors
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('business');
    setUser(null);
    setBusiness(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authAPI.getMe();
      const { user: userData, business: bizData } = data.data;
      setUser(userData);
      setBusiness(bizData);
      localStorage.setItem('user', JSON.stringify(userData));
      if (bizData) localStorage.setItem('business', JSON.stringify(bizData));
    } catch {
      // if refresh fails, log out
      await logout();
    }
  }, [logout]);

  const value = {
    user,
    business,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!user,
    isBusinessOwner: user?.role === 'business_owner',
    isPlatformAdmin: user?.role === 'platform_admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
