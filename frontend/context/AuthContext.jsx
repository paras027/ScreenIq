'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const username = localStorage.getItem('username');
    if (token && username) setUser({ username });
    setLoading(false);
  }, []);

  async function login(credentials) {
    const res = await apiLogin(credentials);
    const token = res.data.access;
    localStorage.setItem('access_token', token);
    localStorage.setItem('username', credentials.username);
    document.cookie = `access_token=${token}; path=/; SameSite=Lax`;
    setUser({ username: credentials.username });
  }

  async function register(credentials) {
    await apiRegister(credentials);
    await login(credentials);
  }

  function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
    document.cookie = 'access_token=; path=/; max-age=0';
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
