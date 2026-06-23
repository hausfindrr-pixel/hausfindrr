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
  const [showSignInModal, setShowSignInModal] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
  }

  const closeMenu = () => setMenuOpen(false);

  function openSignIn() {
    closeMenu();
    setShowSignInModal(true);
  }

  function handleRoleSelect(path) {
    setShowSignInModal(false);
    navigate(path);
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Main bar */}
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" onClick={closeMenu} className="flex items-center gap-2 flex-shrink-0">
              <img src="/logo.svg" alt="HausFindrr" className="w-8 h-8 sm:w-9 sm:h-9" />
              <span className="text-xl sm:text-2xl font-bold text-primary tracking-tight">HausFindrr</span>
            </Link>

            {/* Desktop nav — md and above */}
            <div className="hidden md:flex items-center gap-4">
              {!user && (
                <>
                  <Link to="/browse" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                    Browse
                  </Link>
                  <button
                    onClick={openSignIn}
                    className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
                  >
                    Sign In
                  </button>
                  <Link to="/landlord/register" className="btn-primary text-sm py-2 px-4">
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

            {/* Hamburger — below md */}
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
                  <button
                    onClick={openSignIn}
                    className="flex w-full items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50 hover:text-primary transition-colors"
                  >
                    Sign In
                  </button>
                  <div className="px-1 pt-2 pb-1">
                    <Link
                      to="/landlord/register"
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

      {/* Role selection modal */}
      {showSignInModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          onClick={() => setShowSignInModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Sign In</h2>
                <p className="text-sm text-gray-500 mt-0.5">How are you using HausFindrr?</p>
              </div>
              <button
                onClick={() => setShowSignInModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Role options */}
            <div className="px-6 pb-6 pt-4 space-y-3">
              {/* Tenant */}
              <button
                onClick={() => handleRoleSelect('/tenant/login')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-secondary hover:bg-secondary/5 transition-all group text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary/20 transition-colors">
                  <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">I'm a Tenant</p>
                  <p className="text-xs text-gray-500 mt-0.5">Browse and unlock property listings</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 ml-auto flex-shrink-0 group-hover:text-secondary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Landlord */}
              <button
                onClick={() => handleRoleSelect('/landlord/login')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-primary hover:bg-primary/5 transition-all group text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">I'm a Landlord</p>
                  <p className="text-xs text-gray-500 mt-0.5">Manage and list your properties</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 ml-auto flex-shrink-0 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
