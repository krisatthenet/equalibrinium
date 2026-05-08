import React, { Suspense, useEffect, useState, useTransition, Component } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { initMixpanel, trackPageView } from '@/lib/mixpanel';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import { Toaster } from '@/components/ui/toaster';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import CookieConsent from '@/components/CookieConsent.jsx';
import SparklesIntro from '@/components/SparklesIntro.jsx';
// Lazy load pages for better performance
const HomePage = React.lazy(() => import('@/pages/HomePage.jsx'));
const LoginPage = React.lazy(() => import('@/pages/LoginPage.jsx'));
const RegistrationPage = React.lazy(() => import('@/pages/RegistrationPage.jsx'));
const ClientDashboard = React.lazy(() => import('@/pages/ClientDashboard.jsx'));
const MasterDashboard = React.lazy(() => import('@/pages/MasterDashboard.jsx'));
const ContractorDashboard = React.lazy(() => import('@/pages/ContractorDashboard.jsx'));
const InfluencerDashboard = React.lazy(() => import('@/pages/InfluencerDashboard.jsx'));
const MastersSearchPage = React.lazy(() => import('@/pages/MastersSearchPage.jsx'));
const ContractorsSearchPage = React.lazy(() => import('@/pages/ContractorsSearchPage.jsx'));
const MasterProfilePage = React.lazy(() => import('@/pages/MasterProfilePage.jsx'));
const ContractorProfilePage = React.lazy(() => import('@/pages/ContractorProfilePage.jsx'));
const InfluencerProfilePage = React.lazy(() => import('@/pages/InfluencerProfilePage.jsx'));
const AuctionTicketDetailsPage = React.lazy(() => import('@/pages/AuctionTicketDetailsPage.jsx'));
const AuctionTicketPaymentPage = React.lazy(() => import('@/pages/AuctionTicketPaymentPage.jsx'));
const PaymentSuccessPage = React.lazy(() => import('@/pages/PaymentSuccessPage.jsx'));
const PaymentErrorPage = React.lazy(() => import('@/pages/PaymentErrorPage.jsx'));
const SettingsPage = React.lazy(() => import('@/pages/SettingsPage.jsx'));
const ContactPage = React.lazy(() => import('@/pages/ContactPage.jsx'));
const LocatorPage = React.lazy(() => import('@/pages/LocatorPage.jsx'));
const FavouritesPage = React.lazy(() => import('@/pages/FavouritesPage.jsx'));
const PrivacyPolicyPage = React.lazy(() => import('@/pages/PrivacyPolicyPage.jsx'));
const TermsOfServicePage = React.lazy(() => import('@/pages/TermsOfServicePage.jsx'));
const CookiePolicy = React.lazy(() => import('@/pages/CookiePolicy.jsx'));

const VerifyEmailPage = React.lazy(() => import('@/pages/VerifyEmailPage.jsx'));
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage.jsx'));
const PricingPage = React.lazy(() => import('@/pages/PricingPage.jsx'));

class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center px-4">
            <p className="text-foreground text-lg mb-4">Something went wrong.</p>
            <button
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const PageLoader = () => (
  <div aria-hidden="true" style={{
    position: 'fixed', top: 0, left: 0, right: 0, height: '3px',
    background: 'hsl(var(--primary))', zIndex: 9999,
    animation: 'nav-progress 1.5s ease-in-out infinite',
  }} />
);

// Keeps old page visible while lazy chunk loads; shows slim progress bar instead of black screen.
const AppRoutes = () => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    trackPageView();
    startTransition(() => setDisplayLocation(location));
  }, [location.pathname, location.search]);

  return (
    <>
      {isPending && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, height: '3px',
            background: 'hsl(var(--primary))', zIndex: 9999,
            animation: 'nav-progress 1.5s ease-in-out infinite',
          }}
        />
      )}
      <Suspense fallback={<PageLoader />}>
        <Routes location={displayLocation}>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          <Route path="/auth/confirm-verification/:token" element={<VerifyEmailPage />} />
          <Route path="/masters" element={<MastersSearchPage />} />
          <Route path="/contractors" element={<ContractorsSearchPage />} />
          <Route path="/master/:id" element={<MasterProfilePage />} />
          <Route path="/contractor/:id" element={<ContractorProfilePage />} />
          <Route path="/influencer/:id" element={<InfluencerProfilePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/locator" element={<LocatorPage />} />
          <Route path="/explore" element={<LocatorPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/pricing" element={<PricingPage />} />

          {/* Protected User Routes */}
          <Route path="/dashboard/client" element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/contractor" element={
            <ProtectedRoute allowedRoles={['contractor']}>
              <ContractorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/influencer" element={
            <ProtectedRoute allowedRoles={['influencer']}>
              <InfluencerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/ticket/:id" element={
            <ProtectedRoute>
              <AuctionTicketDetailsPage />
            </ProtectedRoute>
          } />
          <Route path="/auction-ticket/:id" element={
            <ProtectedRoute>
              <AuctionTicketDetailsPage />
            </ProtectedRoute>
          } />
          <Route path="/auction-ticket/:ticketId/payment" element={
            <ProtectedRoute>
              <AuctionTicketPaymentPage />
            </ProtectedRoute>
          } />
          <Route path="/payment-success" element={
            <ProtectedRoute>
              <PaymentSuccessPage />
            </ProtectedRoute>
          } />
          <Route path="/payment-error" element={
            <ProtectedRoute>
              <PaymentErrorPage />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/favourites" element={
            <ProtectedRoute>
              <FavouritesPage />
            </ProtectedRoute>
          } />

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
};

const App = () => {
  useEffect(() => { initMixpanel(); }, []);

  return (
    <ErrorBoundary>
    <BrowserRouter>
      <ScrollToTop />
      <SparklesIntro />
      <AuthProvider>
          <AppRoutes />
      </AuthProvider>
      <Toaster />
      <CookieConsent />
    </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
