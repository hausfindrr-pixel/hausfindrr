import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DASHBOARD_PATH = {
  landlord: '/landlord/dashboard',
  tenant: '/tenant/dashboard',
  admin: '/admin',
};

function useCloseOnOutsideClick(ref, onClose) {
  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [ref, onClose]);
}

function DropdownItem({ to, onClick, icon, label, sub }) {
  const inner = (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
      <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900 leading-tight">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );

  if (to) return <Link to={to} onClick={onClick}>{inner}</Link>;
  return <button className="w-full text-left" onClick={onClick}>{inner}</button>;
}

function Divider() {
  return <div className="my-1 border-t border-gray-100" />;
}

export default function BrowseNavbar({ searchValue, onSearchChange, onSearchSubmit }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState(null); // 'signin' | 'register' | 'account' | null

  const navRef = useRef(null);
  useCloseOnOutsideClick(navRef, () => setActive(null));

  function toggle(name) {
    setActive(a => (a === name ? null : name));
  }

  function close() { setActive(null); }

  const chevron = (open) => (
    <svg
      className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none" stroke="currentColor" viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
    </svg>
  );

  const dropdown = (content) => (
    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 py-1 animate-in">
      {content}
    </div>
  );

  /* ---------- icons ---------- */
  const iconTenant = (
    <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
  const iconLandlord = (
    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
  const iconMessages = (
    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
  const iconSignOut = (
    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
  const iconListings = (
    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );

  /* ---------- user initials avatar ---------- */
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className="bg-white border-b border-gray-100" ref={navRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main row */}
        <div className="flex items-center gap-3 h-14 sm:h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src="/logo.svg" alt="HausFindrr" className="w-7 h-7 sm:w-8 sm:h-8" />
            <span className="text-lg sm:text-xl font-bold text-primary tracking-tight">HausFindrr</span>
          </Link>

          {/* Search bar — desktop */}
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
                {/* ── Sign In dropdown ── */}
                <div className="relative">
                  <button
                    onClick={() => toggle('signin')}
                    className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-primary px-2.5 py-2 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    Sign In
                    {chevron(active === 'signin')}
                  </button>

                  {active === 'signin' && dropdown(
                    <>
                      <div className="px-4 pt-3 pb-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sign in as</p>
                      </div>
                      <DropdownItem
                        to="/tenant/login"
                        onClick={close}
                        icon={iconTenant}
                        label="Tenant"
                        sub="Browse &amp; unlock listings"
                      />
                      <DropdownItem
                        to="/landlord/login"
                        onClick={close}
                        icon={iconLandlord}
                        label="Landlord"
                        sub="Manage your properties"
                      />
                    </>
                  )}
                </div>

                {/* ── Register dropdown ── */}
                <div className="relative">
                  <button
                    onClick={() => toggle('register')}
                    className="flex items-center gap-1 text-sm font-semibold bg-primary text-white px-3 py-2 rounded-xl hover:bg-primary/90 transition-colors whitespace-nowrap"
                  >
                    Register
                    {chevron(active === 'register')}
                  </button>

                  {active === 'register' && dropdown(
                    <>
                      <div className="px-4 pt-3 pb-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Register as</p>
                      </div>
                      <DropdownItem
                        to="/tenant/register"
                        onClick={close}
                        icon={iconTenant}
                        label="Tenant"
                        sub="Browse &amp; unlock listings"
                      />
                      <DropdownItem
                        to="/landlord/register"
                        onClick={close}
                        icon={iconLandlord}
                        label="Landlord"
                        sub="List your property"
                      />
                    </>
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
              /* ── Account dropdown (logged in) ── */
              <div className="relative">
                <button
                  onClick={() => toggle('account')}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{initials}</span>
                  </div>
                  {/* Name — desktop only */}
                  <span className="hidden sm:block text-sm font-semibold text-gray-700 max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <span className="hidden sm:block">{chevron(active === 'account')}</span>
                </button>

                {active === 'account' && dropdown(
                  <>
                    {/* User info header */}
                    <div className="px-4 pt-3 pb-2">
                      <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                    </div>
                    <Divider />

                    {user.role === 'landlord' && (
                      <DropdownItem
                        to="/landlord/dashboard"
                        onClick={close}
                        icon={iconListings}
                        label="My Listings"
                        sub="Manage your properties"
                      />
                    )}
                    {user.role === 'tenant' && (
                      <DropdownItem
                        to="/tenant/dashboard"
                        onClick={close}
                        icon={iconListings}
                        label="My Dashboard"
                        sub="Saved &amp; unlocked"
                      />
                    )}
                    {user.role === 'admin' && (
                      <DropdownItem
                        to="/admin"
                        onClick={close}
                        icon={iconListings}
                        label="Admin Panel"
                        sub="Manage platform"
                      />
                    )}
                    <DropdownItem
                      to={user.role === 'landlord' ? '/landlord/dashboard' : '/tenant/dashboard'}
                      onClick={close}
                      icon={iconMessages}
                      label="Messages"
                      sub="Your conversations"
                    />
                    <Divider />
                    <DropdownItem
                      onClick={() => { close(); logout(); navigate('/'); }}
                      icon={iconSignOut}
                      label="Sign Out"
                    />
                  </>
                )}
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
