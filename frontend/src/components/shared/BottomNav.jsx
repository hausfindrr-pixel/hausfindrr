import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const HIDDEN_PATHS = [
  '/landlord/',
  '/admin',
  '/tenant/login',
  '/tenant/register',
  '/landlord/login',
  '/landlord/register',
];

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (HIDDEN_PATHS.some(p => location.pathname.startsWith(p))) return null;

  const at = (...paths) => paths.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));

  function requireTenant(path) {
    if (!user) { navigate('/tenant/login'); return; }
    navigate(user.role === 'tenant' ? path : user.role === 'landlord' ? '/landlord/dashboard' : '/admin');
  }

  function goAccount() {
    if (!user) navigate('/tenant/login');
    else if (user.role === 'landlord') navigate('/landlord/dashboard');
    else if (user.role === 'admin') navigate('/admin');
    else navigate('/tenant/dashboard');
  }

  const tabs = [
    {
      label: 'Browse',
      active: at('/', '/browse'),
      onClick: () => navigate('/browse'),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      label: 'Saved',
      active: false,
      onClick: () => requireTenant('/tenant/dashboard'),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      label: 'Messages',
      active: false,
      onClick: () => requireTenant('/tenant/dashboard'),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      label: 'Account',
      active: at('/tenant/dashboard', '/landlord/dashboard', '/admin'),
      onClick: goAccount,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex">
        {tabs.map(tab => (
          <button
            key={tab.label}
            onClick={tab.onClick}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 pt-2.5 pb-2"
            style={{ minHeight: 56 }}
          >
            <span className={tab.active ? 'text-primary' : 'text-gray-400'}>
              {tab.icon}
            </span>
            <span className={`text-[11px] font-semibold ${tab.active ? 'text-primary' : 'text-gray-400'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
