import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MessagesProvider } from './context/MessagesContext';
import { NotificationsProvider } from './context/NotificationsContext';
import BottomNav from './components/shared/BottomNav';
import PushPermissionModal from './components/shared/PushPermissionModal';
import NotificationsPage from './pages/NotificationsPage';
import NotificationSettingsPage from './pages/NotificationSettingsPage';

import LandlordLogin from './pages/landlord/LandlordLogin';
import LandlordRegister from './pages/landlord/LandlordRegister';
import LandlordAgreement from './pages/landlord/LandlordAgreement';
import LandlordDashboard from './pages/landlord/LandlordDashboard';
import LandlordNewListing from './pages/landlord/LandlordNewListing';
import LandlordMessagesPage from './pages/landlord/LandlordMessagesPage';
import LandlordPropertiesPage from './pages/landlord/LandlordPropertiesPage';
import LandlordPropertyConversationsPage from './pages/landlord/LandlordPropertyConversationsPage';
import ConversationPage from './pages/landlord/ConversationPage';
import TenantLogin from './pages/tenant/TenantLogin';
import TenantRegister from './pages/tenant/TenantRegister';
import TenantBrowse from './pages/tenant/TenantBrowse';
import TenantDashboard from './pages/tenant/TenantDashboard';
import TenantSavedPage from './pages/tenant/TenantSavedPage';
import TenantMessagesPage from './pages/tenant/TenantMessagesPage';
import PropertyDetail from './pages/PropertyDetail';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import LandlordAgreementPage from './pages/LandlordAgreementPage';
import OAuthCallback from './pages/OAuthCallback';
import CompleteProfile from './pages/CompleteProfile';

function ProtectedRoute({ children, role, requireTerms = true, requireProfile = true }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-primary">Loading…</div>;
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  // Landlords must accept terms before accessing any protected landlord page
  if (requireTerms && user.role === 'landlord' && !user.termsAccepted) {
    return <Navigate to="/landlord/agreement" replace />;
  }
  // All users must complete their profile (phone; landlords also need a govt ID on file)
  if (requireProfile && user.profileComplete === false) {
    return <Navigate to="/complete-profile" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Homepage IS the listings page */}
      <Route path="/" element={<TenantBrowse />} />
      <Route path="/browse" element={<Navigate to="/" replace />} />

      {/* Landlord */}
      <Route path="/landlord/login" element={<LandlordLogin />} />
      <Route path="/landlord/register" element={<LandlordRegister />} />
      <Route path="/landlord/agreement" element={
        <ProtectedRoute role="landlord" requireTerms={false} requireProfile={false}><LandlordAgreement /></ProtectedRoute>
      } />
      <Route path="/landlord/dashboard" element={
        <ProtectedRoute role="landlord" requireProfile={false}><LandlordDashboard /></ProtectedRoute>
      } />
      <Route path="/landlord/new-listing" element={
        <ProtectedRoute role="landlord" requireProfile={false}><LandlordNewListing /></ProtectedRoute>
      } />
      <Route path="/landlord/properties" element={
        <ProtectedRoute role="landlord" requireProfile={false}><LandlordPropertiesPage /></ProtectedRoute>
      } />
      <Route path="/landlord/messages" element={
        <ProtectedRoute role="landlord" requireProfile={false}><LandlordMessagesPage /></ProtectedRoute>
      } />
      <Route path="/landlord/messages/:propertyId" element={
        <ProtectedRoute role="landlord" requireProfile={false}><LandlordPropertyConversationsPage /></ProtectedRoute>
      } />

      {/* Tenant */}
      <Route path="/tenant/login" element={<TenantLogin />} />
      <Route path="/tenant/register" element={<TenantRegister />} />
      <Route path="/tenant/saved" element={
        <ProtectedRoute role="tenant"><TenantSavedPage /></ProtectedRoute>
      } />
      <Route path="/tenant/dashboard" element={
        <ProtectedRoute role="tenant"><TenantDashboard /></ProtectedRoute>
      } />
      <Route path="/tenant/messages" element={
        <ProtectedRoute role="tenant"><TenantMessagesPage /></ProtectedRoute>
      } />
      <Route path="/property/:id" element={<PropertyDetail />} />
      {/* Shared full-screen conversation — no bottom nav (not in ALLOWED_PATHS) */}
      <Route path="/conversation/:propertyId/:otherUserId" element={
        <ProtectedRoute><ConversationPage /></ProtectedRoute>
      } />

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={
        <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
      } />

      {/* Public pages */}
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/landlord-agreement" element={<LandlordAgreementPage />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route path="/complete-profile" element={
        <ProtectedRoute requireTerms={false} requireProfile={false}><CompleteProfile /></ProtectedRoute>
      } />

      {/* Notifications */}
      <Route path="/notifications" element={
        <ProtectedRoute requireProfile={false}><NotificationsPage /></ProtectedRoute>
      } />
      <Route path="/notifications/settings" element={
        <ProtectedRoute requireProfile={false}><NotificationSettingsPage /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <MessagesProvider>
          <AppRoutes />
          <BottomNav />
          <PushPermissionModal />
        </MessagesProvider>
      </NotificationsProvider>
    </AuthProvider>
  );
}
