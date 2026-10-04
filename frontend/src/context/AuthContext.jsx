import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [token, setToken] = useState(() => authService.getToken());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const isAuthenticated = Boolean(user && token);

  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const data = await authService.login(email, password);
      setUser(data.user);
      setToken(data.access_token);
      setIsAuthModalOpen(false);
      return { success: true, user: data.user };
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Login failed';
      setAuthError(detail);
      return { success: false, error: detail };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, fullName = '') => {
    setLoading(true);
    setAuthError(null);
    try {
      const data = await authService.register(email, password, fullName);
      setUser(data.user);
      setToken(data.access_token);
      setIsAuthModalOpen(false);
      return { success: true, user: data.user };
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Registration failed';
      setAuthError(detail);
      return { success: false, error: detail };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email, newPassword) => {
    setLoading(true);
    setAuthError(null);
    try {
      const data = await authService.resetPassword(email, newPassword);
      setUser(data.user);
      setToken(data.access_token);
      setIsAuthModalOpen(false);
      return { success: true, user: data.user };
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Password reset failed';
      setAuthError(detail);
      return { success: false, error: detail };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    window.location.reload();
  };

  const openAuthModal = (mode = 'login') => {
    setAuthMode(mode);
    setAuthError(null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        authError,
        isAuthModalOpen,
        authMode,
        setAuthMode,
        login,
        register,
        resetPassword,
        logout,
        openAuthModal,
        closeAuthModal,
      }}
    >
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

export default AuthContext;
