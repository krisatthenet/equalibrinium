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

  const isSuperuser = (model) => model && (model.collectionName === '_superusers' || model.collectionId === '_pbc_2990389277');

  const resetSessionTimeout = useCallback(() => {
    clearSessionTimeout();
    if (pb.authStore.isValid && isSuperuser(pb.authStore.model)) {
      timeoutRef.current = setTimeout(() => {
        logout();
        window.location.href = '/admin/login?timeout=true';
      }, 30 * 60 * 1000);
    }
  }, [logout, clearSessionTimeout]);

  useEffect(() => {
    if (pb.authStore.isValid && isSuperuser(pb.authStore.model)) {
      setAdminUser(pb.authStore.model);
    } else {
      setAdminUser(null);
    }
    setIsLoading(false);

    const unsubscribe = pb.authStore.onChange((token, model) => {
      if (model && isSuperuser(model)) {
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
      const authData = await pb.collection('_superusers').authWithPassword(email, password);
      setAdminUser(authData.record);
      resetSessionTimeout();
      return authData;
    } catch (err) {
      pb.authStore.clear();
      const errorMessage = err.status === 400
        ? 'Invalid credentials. Please check your email and password.'
        : err.isAbort
          ? 'Network error. Please check your connection and try again.'
          : err.message || 'Failed to authenticate.';
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
