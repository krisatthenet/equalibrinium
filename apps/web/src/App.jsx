import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext.jsx';
import { ImageGenerationProvider } from '@/contexts/ImageGenerationContext.jsx';
import { Toaster } from '@/components/ui/toaster';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute.jsx';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import CookieConsent from '@/components/CookieConsent.jsx';
import AdminLayout from '@/components/AdminLayout.jsx';

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
const PrivacyPolicyPage = React.lazy(() => import('@/pages/PrivacyPolicyPage.jsx'));
const TermsOfServicePage = React.lazy(() => import('@/pages/TermsOfServicePage.jsx'));
const CookiePolicy = React.lazy(() => import('@/pages/CookiePolicy.jsx'));

// Admin Pages
const AdminLoginPage = React.lazy(() => import('@/pages/admin/AdminLoginPage.jsx'));
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard.jsx'));
const AdminUsersPage = React.lazy(() => import('@/pages/admin/AdminUsersPage.jsx'));
const AdminTicketsPage = React.lazy(() => import('@/pages/admin/AdminTicketsPage.jsx'));
const AdminReviewsPage = React.lazy(() => import('@/pages/admin/AdminReviewsPage.jsx'));
const AdminAnalyticsPage = React.lazy(() => import('@/pages/admin/AdminAnalyticsPage.jsx'));
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage.jsx'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <AdminAuthProvider>
          <ImageGenerationProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegistrationPage />} />
                <Route path="/masters" element={<MastersSearchPage />} />
                <Route path="/contractors" element={<ContractorsSearchPage />} />
                <Route path="/master/:id" element={<MasterProfilePage />} />
                <Route path="/contractor/:id" element={<ContractorProfilePage />} />
                <Route path="/influencer/:id" element={<InfluencerProfilePage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/locator" element={<LocatorPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />

                {/* Protected User Routes */}
                <Route path="/dashboard/client" element={
                  <ProtectedRoute allowedRoles={['client']}>
                    <ClientDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/master" element={
                  <ProtectedRoute allowedRoles={['master']}>
                    <MasterDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/contractor" element={
                  <ProtectedRoute allowedRoles={['master', 'contractor']}>
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

                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/admin" element={
                  <ProtectedAdminRoute>
                    <AdminLayout />
                  </ProtectedAdminRoute>
                }>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route path="tickets" element={<AdminTicketsPage />} />
                  <Route path="reviews" element={<AdminReviewsPage />} />
                  <Route path="analytics" element={<AdminAnalyticsPage />} />
                </Route>

                {/* Catch-all 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </ImageGenerationProvider>
        </AdminAuthProvider>
      </AuthProvider>
      <Toaster />
      <CookieConsent />
    </BrowserRouter>
  );
};

export default App;
