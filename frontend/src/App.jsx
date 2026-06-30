import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import BottomNav from './components/shared/BottomNav';

import LandlordLogin from './pages/landlord/LandlordLogin';
import LandlordRegister from './pages/landlord/LandlordRegister';
import LandlordAgreement from './pages/landlord/LandlordAgreement';
import LandlordDashboard from './pages/landlord/LandlordDashboard';
import LandlordNewListing from './pages/landlord/LandlordNewListing';
import TenantLogin from './pages/tenant/TenantLogin';
import TenantRegister from './pages/tenant/TenantRegister';
import TenantBrowse from './pages/tenant/TenantBrowse';
import TenantDashboard from './pages/tenant/TenantDashboard';
import PropertyDetail from './pages/PropertyDetail';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

function ProtectedRoute({ children, role, requireTerms = true }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-primary">Loading…</div>;
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  // Landlords must accept terms before accessing any protected landlord page
  if (requireTerms && user.role === 'landlord' && !user.termsAccepted) {
    return <Navigate to="/landlord/agreement" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<TenantBrowse />} />
      <Route path="/browse" element={<Navigate to="/" replace />} />

      {/* Landlord */}
      <Route path="/landlord/login" element={<LandlordLogin />} />
      <Route path="/landlord/register" element={<LandlordRegister />} />
      <Route path="/landlord/agreement" element={
        <ProtectedRoute role="landlord" requireTerms={false}><LandlordAgreement /></ProtectedRoute>
      } />
      <Route path="/landlord/dashboard" element={
        <ProtectedRoute role="landlord"><LandlordDashboard /></ProtectedRoute>
      } />
      <Route path="/landlord/new-listing" element={
        <ProtectedRoute role="landlord"><LandlordNewListing /></ProtectedRoute>
      } />

      {/* Tenant */}
      <Route path="/tenant/login" element={<TenantLogin />} />
      <Route path="/tenant/register" element={<TenantRegister />} />
      <Route path="/tenant/dashboard" element={
        <ProtectedRoute role="tenant"><TenantDashboard /></ProtectedRoute>
      } />
      <Route path="/property/:id" element={<PropertyDetail />} />

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={
        <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <BottomNav />
    </AuthProvider>
  );
}
