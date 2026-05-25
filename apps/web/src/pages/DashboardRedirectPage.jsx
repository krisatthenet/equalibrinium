import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';

// Redirects /dashboard (bare) to the correct typed dashboard, preserving query params.
// Used by email deep-links, push notifications, and SMS links that don't know the user type.
const DashboardRedirectPage = () => {
  const { userType, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const dest = userType === 'contractor' || userType === 'master'
      ? '/dashboard/contractor'
      : userType === 'influencer'
        ? '/dashboard/influencer'
        : '/dashboard/client';

    navigate(dest + location.search, { replace: true });
  }, [userType, navigate, location.search]);

  return null;
};

export default DashboardRedirectPage;
