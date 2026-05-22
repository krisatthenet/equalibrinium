import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';

const AdminRoute = ({ children }) => {
  const { isAdminAuthenticated, isAdminLoading } = useAdminAuth();
  const location = useLocation();

  if (isAdminLoading) return null;
  if (!isAdminAuthenticated) return <Navigate to="/admin/login" state={{ from: location }} replace />;
  return children;
};

export default AdminRoute;
