import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DASHBOARD_PATH = {
  landlord: '/landlord/dashboard',
  tenant: '/tenant/dashboard',
  admin: '/admin',
};

export default function BrowseNavbar({ searchValue, onSearchChange, onSearchSubmit }) {
  const { user, logout } = useAuth();
  const [registerOpen, setRegisterOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!registerOpen) return;
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setRegisterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [registerOpen]);

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main row: logo | desktop search | auth */}
        <div className="flex items-center gap-3 h-14 sm:h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src="/logo.svg" alt="HausFindrr" className="w-7 h-7 sm:w-8 sm:h-8" />
            <span className="text-lg sm:text-xl font-bold text-primary tracking-tight">HausFindrr</span>
          </Link>

          {/* Search bar — desktop center */}
          <div className="hidden md:flex flex-1 relative mx-4">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Search by location, suburb or area..."
              value={searchValue}
              onChange={onSearchChange}
              onKeyDown={e => { if (e.key === 'Enter') onSearchSubmit(); }}
            />
          </div>

          {/* Auth section */}
          <div className="ml-auto flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {!user ? (
              <>
                <Link
                  to="/tenant/login"
                  className="text-sm font-semibold text-gray-700 hover:text-primary px-2.5 py-2 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  Sign In
                </Link>

                {/* Register dropdown */}
                <div ref={dropdownRef} className="relative">
                  <button
                    onClick={() => setRegisterOpen(o => !o)}
                    className="flex items-center gap-1 text-sm font-semibold bg-primary text-white px-3 py-2 rounded-xl hover:bg-primary/90 transition-colors whitespace-nowrap"
                  >
                    Register
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${registerOpen ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {registerOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20 py-1">
                      <Link
                        to="/tenant/register"
                        onClick={() => setRegisterOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">As Tenant</p>
                          <p className="text-xs text-gray-400">Browse &amp; unlock listings</p>
                        </div>
                      </Link>
                      <Link
                        to="/landlord/register"
                        onClick={() => setRegisterOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">As Landlord</p>
                          <p className="text-xs text-gray-400">List your property</p>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Admin link — subtle, desktop only */}
                <Link
                  to="/admin/login"
                  className="hidden sm:block text-[11px] text-gray-300 hover:text-gray-500 transition-colors ml-1 px-1"
                >
                  Admin
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to={DASHBOARD_PATH[user.role] || '/'}
                  className="text-sm font-medium text-gray-700 hover:text-primary transition-colors max-w-[90px] truncate hidden sm:block"
                >
                  {user.name}
                </Link>
                <Link
                  to={DASHBOARD_PATH[user.role] || '/'}
                  className="text-sm font-semibold text-primary px-3 py-2 rounded-xl border border-primary/20 hover:bg-primary/5 transition-colors sm:hidden"
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors whitespace-nowrap"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile search row */}
        <div className="flex md:hidden pb-3">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Search by location..."
              value={searchValue}
              onChange={onSearchChange}
              onKeyDown={e => { if (e.key === 'Enter') onSearchSubmit(); }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
