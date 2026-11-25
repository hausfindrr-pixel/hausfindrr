import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMessages } from '../../context/MessagesContext';

const LANDLORD_PATHS = ['/landlord/properties', '/landlord/messages', '/landlord/dashboard'];
// Messages sub-pages also show the nav
function matchesLandlordMessages(pathname) {
  return pathname.startsWith('/landlord/messages');
}
const TENANT_PATHS  = ['/', '/tenant/saved', '/tenant/dashboard', '/tenant/messages'];

export default function BottomNav() {
  const { user } = useAuth();
  const { totalUnread } = useMessages();
  const location = useLocation();
  const navigate = useNavigate();

  const isLandlord = user?.role === 'landlord';

  function matchPath(p) {
    return location.pathname === p;
  }

  const allowedPaths = isLandlord ? LANDLORD_PATHS : TENANT_PATHS;
  const visible = isLandlord
    ? (allowedPaths.some(p => matchPath(p)) || matchesLandlordMessages(location.pathname))
    : allowedPaths.some(p => matchPath(p));
  if (!visible) return null;

  const at = (...paths) => paths.some(p => matchPath(p));

  function requireAuth(path) {
    if (!user) { navigate('/tenant/login'); return; }
    navigate(path);
  }

  function goMessages() {
    if (!user) { navigate('/tenant/login'); return; }
    if (isLandlord) navigate('/landlord/messages');
    else navigate('/tenant/messages');
  }

  const messagesActive = isLandlord
    ? matchesLandlordMessages(location.pathname)
    : at('/tenant/messages');

  const landlordTabs = [
    {
      label: 'Properties',
      active: at('/landlord/properties'),
      onClick: () => navigate('/landlord/properties'),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: 'Messages',
      active: messagesActive,
      onClick: goMessages,
      badge: totalUnread > 0 ? (totalUnread > 9 ? '9+' : String(totalUnread)) : null,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      label: 'Account',
      active: at('/landlord/dashboard'),
      onClick: () => navigate('/landlord/dashboard'),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  const tenantTabs = [
    {
      label: 'Browse',
      active: at('/'),
      onClick: () => navigate('/'),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      label: 'Saved',
      active: at('/tenant/saved'),
      onClick: () => requireAuth('/tenant/saved'),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      label: 'Messages',
      active: messagesActive,
      onClick: goMessages,
      badge: totalUnread > 0 ? (totalUnread > 9 ? '9+' : String(totalUnread)) : null,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      label: 'Account',
      active: at('/tenant/dashboard'),
      onClick: () => requireAuth('/tenant/dashboard'),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  const tabs = isLandlord ? landlordTabs : tenantTabs;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex">
        {tabs.map(tab => (
          <button
            key={tab.label}
            onClick={tab.onClick}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 pt-2.5 pb-2 relative"
            style={{ minHeight: 56 }}
          >
            <span className={`relative ${tab.active ? 'text-primary' : 'text-gray-400'}`}>
              {tab.icon}
              {tab.badge && (
                <span className="absolute -top-1 -right-2 min-w-[16px] h-4 bg-[#975536] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                  {tab.badge}
                </span>
              )}
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
