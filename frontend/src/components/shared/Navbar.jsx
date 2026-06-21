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

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main bar */}
        <div className="flex items-center justify-between h-16">

          {/* Logo — flex-shrink-0 prevents it from being squished */}
          <Link to="/" onClick={closeMenu} className="flex items-center gap-2 flex-shrink-0">
            <img src="/logo.svg" alt="HausFindrr" className="w-8 h-8 sm:w-9 sm:h-9" />
            <span className="text-xl sm:text-2xl font-bold text-primary tracking-tight">HausFindrr</span>
          </Link>

          {/* Desktop nav — only at md (768px) and above */}
          <div className="hidden md:flex items-center gap-4">
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
                <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
                  Sign out
                </button>
              </div>
            )}
          </div>

          {/* Hamburger — only below md */}
          <button
            className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {!user ? (
              <>
                <Link
                  to="/browse"
                  onClick={closeMenu}
                  className="flex items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  Browse Listings
                </Link>
                <Link
                  to="/tenant/login"
                  onClick={closeMenu}
                  className="flex items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  Tenant Sign In
                </Link>
                <div className="px-1 pt-2 pb-1">
                  <Link
                    to="/landlord/login"
                    onClick={closeMenu}
                    className="block w-full text-center btn-primary text-sm py-3"
                  >
                    List a Property
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 px-3 py-2 mb-1">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">{user.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className={`text-xs font-medium ${ROLE_COLORS[user.role]?.split(' ')[1] || 'text-gray-500'}`}>
                      {ROLE_LABELS[user.role]}
                    </p>
                  </div>
                </div>
                <Link
                  to={user.role === 'landlord' ? '/landlord/dashboard' : user.role === 'admin' ? '/admin' : '/tenant/dashboard'}
                  onClick={closeMenu}
                  className="flex items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  My Dashboard
                </Link>
                <button
                  onClick={() => { closeMenu(); handleLogout(); }}
                  className="flex w-full items-center px-3 py-3 text-sm font-medium text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                >
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
