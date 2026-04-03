import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient.js';

const AdminAuthContext = createContext(null);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);

  const logout = useCallback(() => {
    pb.authStore.clear();
    setAdminUser(null);
    setError(null);
  }, []);

  const clearSessionTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const resetSessionTimeout = useCallback(() => {
    clearSessionTimeout();
    if (pb.authStore.isValid && pb.authStore.model?.role === 'admin') {
      timeoutRef.current = setTimeout(() => {
        logout();
        // Hard redirect so the full app state is reset and the timeout param is preserved
        window.location.href = '/admin/login?timeout=true';
      }, 30 * 60 * 1000);
    }
  }, [logout, clearSessionTimeout]);

  useEffect(() => {
    // Restore session on mount
    if (pb.authStore.isValid && pb.authStore.model?.role === 'admin') {
      setAdminUser(pb.authStore.model);
    } else {
      setAdminUser(null);
    }
    setIsLoading(false);

    const unsubscribe = pb.authStore.onChange((token, model) => {
      if (model?.role === 'admin') {
        setAdminUser(model);
      } else {
        setAdminUser(null);
      }
    });

    // Activity events that reset the idle timeout
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach((name) => document.addEventListener(name, resetSessionTimeout, true));

    resetSessionTimeout();

    return () => {
      unsubscribe();
      activityEvents.forEach((name) =>
        document.removeEventListener(name, resetSessionTimeout, true)
      );
      clearSessionTimeout();
    };
  }, [logout, resetSessionTimeout, clearSessionTimeout]);

  const login = async (email, password) => {
    setError(null);
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);

      if (authData.record.role !== 'admin') {
        pb.authStore.clear();
        throw new Error('Unauthorized: Admin access required.');
      }

      setAdminUser(authData.record);
      resetSessionTimeout();
      return authData;
    } catch (err) {
      pb.authStore.clear();

      let errorMessage = 'An unexpected error occurred.';
      if (err.message === 'Unauthorized: Admin access required.') {
        errorMessage = err.message;
      } else if (err.status === 400) {
        errorMessage = 'Invalid credentials. Please check your email and password.';
      } else if (err.isAbort) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage = err.message || 'Failed to authenticate.';
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const value = {
    adminUser,
    isAdminAuthenticated: !!adminUser,
    login,
    logout,
    isLoading,
    error,
    // Aliases for backwards compatibility with existing components
    adminLogin: login,
    adminLogout: logout,
    isAdminLoading: isLoading,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};
