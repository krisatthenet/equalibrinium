import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';
import { Loader2 } from 'lucide-react';

const ProtectedAdminRoute = ({ children }) => {
  const { isAdminAuthenticated, isAdminLoading } = useAdminAuth();
  const location = useLocation();

  if (isAdminLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--admin-bg))] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--admin-primary))]" />
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedAdminRoute;