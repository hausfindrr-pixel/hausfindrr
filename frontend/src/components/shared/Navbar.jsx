import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABELS = { landlord: 'Landlord', tenant: 'Tenant', admin: 'Admin' };
const ROLE_COLORS = {
  landlord: 'bg-primary/10 text-primary',
  tenant: 'bg-secondary/10 text-secondary',
  admin: 'bg-gray-100 text-gray-600',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="HausFindrr" className="w-9 h-9" />
            <span className="text-2xl font-bold text-primary tracking-tight">HausFindrr</span>
          </Link>

          {/* Desktop right side */}
          <div className="hidden sm:flex items-center gap-4">
            {!user && (
              <>
                <Link to="/browse" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                  Browse
                </Link>
                <Link to="/tenant/login" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                  Tenant Login
                </Link>
                <Link to="/landlord/login" className="btn-primary text-sm py-2 px-4">
                  List a Property
                </Link>
              </>
            )}
            {user && (
              <div className="flex items-center gap-3">
                <Link
                  to={user.role === 'landlord' ? '/landlord/dashboard' : user.role === 'admin' ? '/admin' : '/tenant/dashboard'}
                  className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                >
                  {user.name}
                </Link>
                <span className={`badge ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600'}`}>
                  {ROLE_LABELS[user.role]}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden pb-4 space-y-2 border-t border-gray-100 pt-3">
            {!user && (
              <>
                <Link to="/browse" className="block px-2 py-2 text-sm text-gray-700 hover:text-primary" onClick={() => setMenuOpen(false)}>Browse</Link>
                <Link to="/tenant/login" className="block px-2 py-2 text-sm text-gray-700 hover:text-primary" onClick={() => setMenuOpen(false)}>Tenant Login</Link>
                <Link to="/landlord/login" className="block px-2 py-2 text-sm text-gray-700 hover:text-primary" onClick={() => setMenuOpen(false)}>List a Property</Link>
              </>
            )}
            {user && (
              <>
                <div className="flex items-center gap-2 px-2 py-2">
                  <span className="text-sm font-medium text-gray-700">{user.name}</span>
                  <span className={`badge ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600'}`}>{ROLE_LABELS[user.role]}</span>
                </div>
                <button onClick={handleLogout} className="block w-full text-left px-2 py-2 text-sm text-gray-500 hover:text-gray-800">
                  Sign out
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
