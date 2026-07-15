import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('adminAccessToken');
      if (token) {
        try {
          const res = await axios.get('/api/platform-admin/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setAdminUser(res.data.data.user);
        } catch (error) {
          console.error("Admin auth initialization failed", error);
          localStorage.removeItem('adminAccessToken');
          localStorage.removeItem('adminRefreshToken');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await axios.post('/api/platform-admin/auth/login', { email, password });
    const { accessToken, refreshToken, user } = res.data.data;
    localStorage.setItem('adminAccessToken', accessToken);
    localStorage.setItem('adminRefreshToken', refreshToken);
    setAdminUser(user);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('adminRefreshToken');
    if (refreshToken) {
      try {
        await axios.post('/api/platform-admin/auth/logout', { refreshToken });
      } catch (e) {
        console.error(e);
      }
    }
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    setAdminUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ adminUser, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
