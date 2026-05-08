import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { identify, track, reset as mixpanelReset } from '@/lib/mixpanel';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (pb.authStore.isValid) {
      const model = pb.authStore.model;
      setCurrentUser(model);
      identify(model.id, { $email: model.email, user_type: model.userType });
    }
    setInitialLoading(false);

    const unsubscribe = pb.authStore.onChange((token, model) => {
      setCurrentUser(model);
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email, password, userType, additionalData = {}) => {
    const data = {
      email,
      password,
      passwordConfirm: password,
      userType,
      ...additionalData
    };

    const record = await pb.collection('users').create(data);
    pb.collection('users').requestVerification(email).catch(() => {});
    identify(record.id, { $email: email, user_type: userType });
    track('sign_up_completed', { user_type: userType, sign_up_method: 'email' });
    return record;
  };

  const login = async (email, password) => {
    const authData = await pb.collection('users').authWithPassword(email, password);
    setCurrentUser(authData.record);
    identify(authData.record.id, { $email: email, user_type: authData.record.userType });
    return authData;
  };

  const logout = () => {
    pb.authStore.clear();
    setCurrentUser(null);
    mixpanelReset();
  };

  const requestPasswordReset = async (email) => {
    await pb.collection('users').requestPasswordReset(email);
  };

  const resendVerification = async (email) => {
    await pb.collection('users').requestVerification(email);
  };

  const value = {
    currentUser,
    signup,
    login,
    logout,
    requestPasswordReset,
    resendVerification,
    isAuthenticated: !!currentUser,
    userType: currentUser?.userType
  };

  if (initialLoading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#0a0a0a',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', zIndex: 9999, gap: '24px',
      }}>
        <img src="/logo-192.png" alt="WorkBee" style={{ width: 72, height: 72, animation: 'sp-pulse 1.8s ease-in-out infinite' }} />
        <div style={{ width: 160, height: 3, background: '#1f1f1f', borderRadius: 9999, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, height: '100%', background: '#facc15', borderRadius: 9999, animation: 'sp-slide 1.5s ease-in-out infinite' }} />
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
