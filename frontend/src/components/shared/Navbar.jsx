import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABELS = { landlord: 'Landlord', tenant: 'Tenant', admin: 'Admin' };
const ROLE_COLORS = {
  landlord: 'bg-primary/10 text-primary',
  tenant: 'bg-secondary/10 text-secondary',
  admin: 'bg-gray-100 text-gray-600',
};

function RoleModal({ title, subtitle, options, onSelect, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 pb-6 pt-4 space-y-3">
          {options.map(opt => (
            <button
              key={opt.path}
              onClick={() => onSelect(opt.path)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-${opt.accent} hover:bg-${opt.accent}/5 transition-all group text-left`}
            >
              <div className={`w-11 h-11 rounded-xl bg-${opt.accent}/10 flex items-center justify-center flex-shrink-0 group-hover:bg-${opt.accent}/20 transition-colors`}>
                {opt.icon}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{opt.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
              </div>
              <svg className={`w-4 h-4 text-gray-300 ml-auto flex-shrink-0 group-hover:text-${opt.accent} transition-colors`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const SIGN_IN_OPTIONS = [
  {
    path: '/tenant/login',
    accent: 'secondary',
    label: "I'm a Tenant",
    description: 'Browse and unlock property listings',
    icon: (
      <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    path: '/landlord/login',
    accent: 'primary',
    label: "I'm a Landlord",
    description: 'Manage and list your properties',
    icon: (
      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
];

const REGISTER_OPTIONS = [
  {
    path: '/tenant/register',
    accent: 'secondary',
    label: 'Register as Tenant',
    description: 'Find and unlock properties to rent or buy',
    icon: (
      <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    path: '/landlord/register',
    accent: 'primary',
    label: 'Register as Landlord',
    description: 'List your properties and reach tenants across PNG',
    icon: (
      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState(null); // 'signin' | 'register' | null

  function handleLogout() {
    logout();
    navigate('/');
  }

  const closeMenu = () => setMenuOpen(false);

  function handleRoleSelect(path) {
    setModal(null);
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

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-5">
              {!user && (
                <>
                  <button
                    onClick={() => setModal('signin')}
                    className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setModal('register')}
                    className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
                  >
                    Register
                  </button>
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
              {/* Discreet admin access — no label, low visual weight */}
              <Link
                to="/admin/login"
                aria-label="Admin"
                className="text-gray-300 hover:text-gray-400 transition-colors ml-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
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
                  <button
                    onClick={() => { closeMenu(); setModal('signin'); }}
                    className="flex w-full items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50 hover:text-primary transition-colors"
                  >
                    Sign In
                  </button>
                  <div className="px-1 pt-2 pb-1 space-y-2">
                    <Link
                      to="/tenant/register"
                      onClick={closeMenu}
                      className="block w-full text-center bg-secondary/10 text-secondary font-semibold text-sm py-3 rounded-xl hover:bg-secondary/20 transition-colors"
                    >
                      Register as Tenant
                    </Link>
                    <Link
                      to="/landlord/register"
                      onClick={closeMenu}
                      className="block w-full text-center btn-primary text-sm py-3"
                    >
                      Register as Landlord
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

      {/* Sign In modal */}
      {modal === 'signin' && (
        <RoleModal
          title="Sign In"
          subtitle="How are you using HausFindrr?"
          options={SIGN_IN_OPTIONS}
          onSelect={handleRoleSelect}
          onClose={() => setModal(null)}
        />
      )}

      {/* Register modal */}
      {modal === 'register' && (
        <RoleModal
          title="Create an Account"
          subtitle="What brings you to HausFindrr?"
          options={REGISTER_OPTIONS}
          onSelect={handleRoleSelect}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
