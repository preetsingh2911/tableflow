import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Pages
import LandingPage from './pages/LandingPage';
import MarketingLayout from './components/MarketingLayout';
import PricingPage from './pages/Marketing/PricingPage';
import TermsPage from './pages/Marketing/TermsPage';
import PrivacyPage from './pages/Marketing/PrivacyPage';
import ContactPage from './pages/Marketing/ContactPage';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardLayout from './pages/Dashboard/DashboardLayout';
import DashboardHome from './pages/Dashboard/DashboardHome';
import OutletsPage from './pages/Dashboard/OutletsPage';
import BookingsPage from './pages/Dashboard/BookingsPage';
import SettingsPage from './pages/Dashboard/SettingsPage';
import SubscriptionPage from './pages/Dashboard/SubscriptionPage';
import OnboardingWizard from './pages/Dashboard/OnboardingWizard';
import CustomersPage from './pages/Dashboard/CustomersPage';
import BlockedDatesPage from './pages/Dashboard/BlockedDatesPage';
import BookingPageSettings from './pages/Dashboard/BookingPageSettings';
import BookingPage from './pages/BookingPage';
import BookingStatusPage from './pages/BookingStatusPage';
import CancelBookingPage from './pages/CancelBookingPage';

// Admin Pages
import { AdminAuthProvider } from './context/AdminAuthContext';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminBusinesses from './pages/Admin/AdminBusinesses';
import AdminSubscriptions from './pages/Admin/AdminSubscriptions';
import AdminSettings from './pages/Admin/AdminSettings';
import AdminBusinessDetail from './pages/Admin/AdminBusinessDetail';

/**
 * Protected route wrapper
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Pages with Marketing Layout */}
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      {/* Auth & Other Public Pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      
      <Route path="/demo" element={<Navigate to="/book/demo" replace />} />

      {/* Public Booking */}
      <Route path="/book/:slug" element={<BookingPage />} />
      <Route path="/booking/:confirmationCode" element={<BookingStatusPage />} />
      <Route path="/cancel/:confirmationCode" element={<CancelBookingPage />} />

      {/* Protected Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="outlets" element={<OutletsPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="billing" element={<SubscriptionPage />} />
        <Route path="onboarding" element={<OnboardingWizard />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="blocked-dates" element={<BlockedDatesPage />} />
        <Route path="booking-page" element={<BookingPageSettings />} />
      </Route>

      {/* Platform Admin Routes */}
      <Route path="/platform-admin/login" element={
        <AdminAuthProvider>
          <AdminLogin />
        </AdminAuthProvider>
      } />
      <Route path="/platform-admin" element={
        <AdminAuthProvider>
          <AdminLayout />
        </AdminAuthProvider>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="businesses" element={<AdminBusinesses />} />
        <Route path="businesses/:id" element={<AdminBusinessDetail />} />
        <Route path="subscriptions" element={<AdminSubscriptions />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
