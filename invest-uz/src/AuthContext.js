import { createContext, useContext, useMemo, useState } from 'react';
import { apiFetch } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('ro_token') || '');
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('ro_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [error, setError] = useState('');

  const saveSession = (data) => {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('ro_token', data.token);
    localStorage.setItem('ro_user', JSON.stringify(data.user));
  };

  const clearSession = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('ro_token');
    localStorage.removeItem('ro_user');
  };

  const login = async (username, password) => {
    setError('');
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    saveSession(data);
    return data;
  };

  const register = async (payload) => {
    setError('');
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    saveSession(data);
    return data;
  };

  const logout = async () => {
    try {
      if (token) {
        await apiFetch('/api/auth/logout', { method: 'POST' }, token);
      }
    } catch (err) {
    }
    clearSession();
  };

  const value = useMemo(
    () => ({
      token,
      user,
      error,
      setError,
      login,
      register,
      logout,
      setUser,
      isAuthed: !!token && !!user
    }),
    [token, user, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
