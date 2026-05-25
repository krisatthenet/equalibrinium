import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';


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
    const isSuperuser = (model) => model && (
      model.collectionName === '_superusers' || model.collectionId === '_pbc_2990389277'
    );

    const init = async () => {
      if (pb.authStore.isValid) {
        const model = pb.authStore.model;
        // Superuser tokens belong to AdminAuthContext — don't touch them
        if (isSuperuser(model)) {
          setInitialLoading(false);
          return;
        }
        try {
          const fresh = await pb.collection('users').getOne(model.id, { $autoCancel: false });
          setCurrentUser(fresh);
        } catch {
          // Record no longer exists — clear stale session
          pb.authStore.clear();
        }
      }
      setInitialLoading(false);
    };
    init();

    const unsubscribe = pb.authStore.onChange((token, model) => {
      if (!isSuperuser(model)) setCurrentUser(model);
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
    await pb.collection('users').requestVerification(email);
    const authData = await pb.collection('users').authWithPassword(email, password);
    setCurrentUser(authData.record);
    return record;
  };

  const login = async (email, password) => {
    const authData = await pb.collection('users').authWithPassword(email, password);
    setCurrentUser(authData.record);
    return authData;
  };

  const loginWithOAuth2 = async (provider, createData = {}) => {
    const options = { provider };
    if (Object.keys(createData).length > 0) options.createData = createData;
    const authData = await pb.collection('users').authWithOAuth2(options);
    setCurrentUser(authData.record);
    return authData;
  };

  const refreshUser = async () => {
    const fresh = await pb.collection('users').getOne(pb.authStore.model.id, { $autoCancel: false });
    setCurrentUser(fresh);
    return fresh;
  };

  const logout = () => {
    pb.authStore.clear();
    setCurrentUser(null);
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
    loginWithOAuth2,
    refreshUser,
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
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      }}>
        <span style={{ fontSize: 56, animation: 'sp-fly 1.6s ease-in-out infinite' }}>🐝</span>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
