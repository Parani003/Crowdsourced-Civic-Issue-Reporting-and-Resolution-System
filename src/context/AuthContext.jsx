import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if session cookie is valid on load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data.status === 'success') {
          setUser(res.data.data.user);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.status === 'success') {
        setUser(res.data.data.user);
        return res.data.data.user;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please check credentials.';
      setError(message);
      throw new Error(message);
    }
  };

  const register = async (name, email, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      return res.data; // Return registration success metadata
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed.';
      setError(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
