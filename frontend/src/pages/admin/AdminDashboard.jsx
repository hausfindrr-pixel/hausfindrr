import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { priceLabel } from '../../utils/format';

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  pending_verification: 'bg-amber-100 text-amber-700',
  active:              'bg-green-100 text-green-700',
  rejected:            'bg-red-100 text-red-700',
  suspended:           'bg-gray-100 text-gray-500',
  pending:             'bg-amber-100 text-amber-700',
  success:             'bg-green-100 text-green-700',
  failed:              'bg-red-100 text-red-700',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-500'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const AVATAR_PALETTE = [
  ['bg-primary/10', 'text-primary'],
  ['bg-secondary/10', 'text-secondary'],
  ['bg-blue-100', 'text-blue-600'],
  ['bg-purple-100', 'text-purple-600'],
  ['bg-teal-100', 'text-teal-600'],
  ['bg-rose-100', 'text-rose-600'],
];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

// ─── Shared components ────────────────────────────────────────────────────────
function Empty({ text }) {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
      <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-gray-400 font-medium text-sm">{text}</p>
    </div>
  );
}

function DocLightbox({ url, onClose }) {
  if (!url) return null;
  const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url) || url.includes('/image/upload/');
  return (
    <div className="fixed inset-0 bg-black/85 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {isImage ? (
          <img
            src={url}
            alt="Document"
            style={{ display: 'block', width: '100%', maxHeight: '88vh', objectFit: 'contain', borderRadius: '1rem' }}
          />
        ) : (
          <iframe
            src={url}
            title="Document"
            style={{ display: 'block', width: '100%', height: '80vh', border: 'none', borderRadius: '1rem' }}
          />
        )}
      </div>
    </div>
  );
}

function RejectModal({ title, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="font-bold text-gray-900 mb-1">{title || 'Rejection Reason'}</h3>
        <p className="text-sm text-gray-500 mb-4">Provide a reason so the user knows what to fix.</p>
        <textarea
          className="input h-24 resize-none mb-4 text-sm"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="e.g. ID document is blurry. Please resubmit a clear photo…"
          autoFocus
        />
        <div className="flex gap-3">
          <button
            className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-semibold hover:bg-red-600 transition-colors text-sm disabled:opacity-40"
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason.trim())}
          >
            Confirm Rejection
          </button>
          <button className="flex-1 btn-outline text-sm py-2.5" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color || 'bg-primary/10 text-primary'}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Sidebar nav config ───────────────────────────────────────────────────────
const NAV = [
  {
    key: 'dashboard', label: 'Dashboard',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/><rect x="14" y="3" width="7" height="7" rx="1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="14" width="7" height="7" rx="1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/><rect x="14" y="14" width="7" height="7" rx="1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    key: 'pending_landlords', label: 'Pending Landlords', pendingKey: 'pendingLandlords',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h11m2-5a3 3 0 11-6 0 3 3 0 016 0zm0 0v1m0-4v1" /></svg>,
  },
  {
    key: 'pending_listings', label: 'Pending Listings', pendingKey: 'pendingListings',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    key: 'all_landlords', label: 'All Landlords',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    key: 'all_listings', label: 'All Listings',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  },
  {
    key: 'transactions', label: 'Transactions',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  },
  {
    key: 'messages', label: 'Messages',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  },
  {
    key: 'security', label: 'Security',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  },
];

// ─── Sidebar (must be top-level — defining inside AdminDashboard causes remount on every render) ──
function AdminSidebar({ section, pendingCounts, onNavigate, onLogout }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-base">H</span>
          </div>
          <div>
            <p className="font-bold text-white leading-none">HausFindrr</p>
            <p className="text-white/50 text-xs mt-0.5">Admin Console</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {NAV.map(item => {
          const active = section === item.key;
          const count = item.pendingKey ? pendingCounts[item.pendingKey] : 0;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                active ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className={active ? 'text-white' : 'text-white/50 group-hover:text-white/80 transition-colors'}>
                  {item.icon}
                </span>
                {item.label}
              </span>
              {count > 0 && (
                <span className="bg-amber-400 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-2">
        <button
          onClick={onLogout}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all group w-full"
        >
          <span className="text-white/50 group-hover:text-white/80 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </span>
          Logout
        </button>
      </div>

      <div className="px-4 py-3 border-t border-white/10">
        <p className="text-white/30 text-xs text-center">HausFindrr Admin · 2026</p>
      </div>
    </div>
  );
}

// ─── Main shell ───────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { logout } = useAuth();
  const [section, setSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCounts, setPendingCounts] = useState({ pendingLandlords: 0, pendingListings: 0 });

  useEffect(() => {
    api.get('/admin/analytics')
      .then(({ data }) => setPendingCounts({ pendingLandlords: data.pendingLandlords ?? 0, pendingListings: data.pendingListings ?? 0 }))
      .catch(() => setPendingCounts({ pendingLandlords: 0, pendingListings: 0 }));
  }, [section]);

  function go(key) {
    setSection(key);
    setSidebarOpen(false);
  }

  function handleLogout() {
    logout();
    window.location.href = '/';
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 fixed inset-y-0 left-0 bg-primary z-30">
        <AdminSidebar section={section} pendingCounts={pendingCounts} onNavigate={go} onLogout={handleLogout} />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 flex flex-col bg-primary z-10">
            <AdminSidebar section={section} pendingCounts={pendingCounts} onNavigate={go} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      {/* Page content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-100 flex items-center gap-3 px-4 h-14 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">H</span>
            </div>
            <span className="font-bold text-gray-900 text-sm">Admin Console</span>
          </div>
          {(pendingCounts.pendingLandlords + pendingCounts.pendingListings) > 0 && (
            <span className="ml-auto bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingCounts.pendingLandlords + pendingCounts.pendingListings} pending
            </span>
          )}
        </header>

        <main className="flex-1 p-4 md:p-8">
          {section === 'dashboard'         && <DashboardSection />}
          {section === 'pending_landlords' && <PendingLandlordsSection onCountChange={n => setPendingCounts(p => ({ ...p, pendingLandlords: n }))} />}
          {section === 'pending_listings'  && <PendingListingsSection  onCountChange={n => setPendingCounts(p => ({ ...p, pendingListings: n }))} />}
          {section === 'all_landlords'     && <AllLandlordsSection />}
          {section === 'all_listings'      && <AllListingsSection />}
          {section === 'transactions'      && <TransactionsSection />}
          {section === 'messages'          && <MessagesSection />}
          {section === 'security'           && <SecuritySection />}
        </main>
      </div>
    </div>
  );
}

const EMPTY_ANALYTICS = {
  totalLandlords: 0, totalTenants: 0, totalActiveListings: 0,
  totalUnlocks: 0, totalRevenue: 0,
  pendingLandlords: 0, pendingListings: 0,
  recentActivity: [],
  registrationChart: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(label => ({ label, landlords: 0, tenants: 0 })),
  revenueChart: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(label => ({ label, unlocks: 0, revenue: 0 })),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashboardSection() {
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    api.get('/admin/analytics')
      .then(({ data: d }) => setData(d))
      .catch(() => setData(EMPTY_ANALYTICS));
  }, []);

  if (!data) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Platform overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Active Landlords" value={data.totalLandlords}
          color="bg-primary/10 text-primary"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard
          label="Tenants" value={data.totalTenants}
          color="bg-secondary/10 text-secondary"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
        />
        <StatCard
          label="Active Listings" value={data.totalActiveListings}
          color="bg-blue-100 text-blue-600"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <StatCard
          label="Total Revenue" value={`K${Number(data.totalRevenue || 0).toLocaleString()}`}
          sub={`${data.totalUnlocks} unlocks`}
          color="bg-green-100 text-green-600"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* Pending alerts */}
      {(data.pendingLandlords > 0 || data.pendingListings > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.pendingLandlords > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <p className="font-semibold text-amber-900 text-sm">{data.pendingLandlords} landlord{data.pendingLandlords !== 1 ? 's' : ''} pending review</p>
                <p className="text-amber-700 text-xs">Awaiting identity verification</p>
              </div>
            </div>
          )}
          {data.pendingListings > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <p className="font-semibold text-amber-900 text-sm">{data.pendingListings} listing{data.pendingListings !== 1 ? 's' : ''} pending review</p>
                <p className="text-amber-700 text-xs">Awaiting property approval</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Registrations stacked bar */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-0.5">New Registrations (7d)</p>
          <p className="text-xs text-gray-400 mb-4">Landlords + Tenants</p>
          {data.registrationChart && (() => {
            const maxVal = Math.max(...data.registrationChart.map(d => (d.landlords || 0) + (d.tenants || 0)), 1);
            return (
              <div className="flex items-end gap-1.5 h-20">
                {data.registrationChart.map((d, i) => {
                  const total = (d.landlords || 0) + (d.tenants || 0);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                      <div
                        className="w-full flex flex-col rounded-t overflow-hidden"
                        style={{ height: `${Math.max((total / maxVal) * 72, total ? 4 : 0)}px` }}
                      >
                        <div style={{ flex: d.landlords || 0, backgroundColor: '#41271b', minHeight: d.landlords > 0 ? 2 : 0 }} />
                        <div style={{ flex: d.tenants || 0, backgroundColor: '#975536', minHeight: d.tenants > 0 ? 2 : 0 }} />
                      </div>
                      <span className="text-[9px] text-gray-400">{d.label}</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
          <div className="flex gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: '#41271b' }} />Landlords
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: '#975536' }} />Tenants
            </span>
          </div>
        </div>

        {/* Revenue bar */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-0.5">Revenue (7d)</p>
          <p className="text-xs text-gray-400 mb-4">Unlock fees · K25 each</p>
          {data.revenueChart && (() => {
            const maxVal = Math.max(...data.revenueChart.map(d => d.revenue || 0), 1);
            return (
              <div className="flex items-end gap-1.5 h-20">
                {data.revenueChart.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div
                      className="w-full rounded-t"
                      style={{ height: `${Math.max((d.revenue / maxVal) * 72, d.revenue ? 4 : 0)}px`, backgroundColor: '#22c55e', opacity: d.revenue ? 1 : 0.15 }}
                    />
                    <span className="text-[9px] text-gray-400">{d.label}</span>
                  </div>
                ))}
              </div>
            );
          })()}
          <div className="flex gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2.5 h-2.5 rounded-sm inline-block bg-green-500" />Revenue (K)
            </span>
          </div>
        </div>
      </div>

      {/* Activity feed */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <p className="font-semibold text-gray-900 text-sm">Recent Activity</p>
        </div>
        {data.recentActivity.length === 0
          ? <p className="px-5 py-8 text-center text-gray-400 text-sm">No recent activity</p>
          : (
            <div className="divide-y divide-gray-50">
              {data.recentActivity.map((ev, i) => {
                const iconProps = {
                  landlord_register: { bg: 'bg-primary/10', color: 'text-primary', d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                  listing_active:    { bg: 'bg-blue-100',   color: 'text-blue-500', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                  unlock:            { bg: 'bg-green-100',  color: 'text-green-500', d: 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z' },
                  message:           { bg: 'bg-gray-100',   color: 'text-gray-400', d: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
                }[ev.type] || { bg: 'bg-gray-100', color: 'text-gray-400', d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' };
                return (
                  <div key={i} className="px-5 py-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${iconProps.bg}`}>
                      <svg className={`w-4 h-4 ${iconProps.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconProps.d} />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-700 flex-1">{ev.text}</p>
                    <p className="text-xs text-gray-400 flex-shrink-0">{timeAgo(ev.time)}</p>
                  </div>
                );
              })}
            </div>
          )
        }
      </div>
    </div>
  );
}

// ─── Pending Landlords ────────────────────────────────────────────────────────
function PendingLandlordsSection({ onCountChange }) {
  const [landlords, setLandlords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [acting, setActing] = useState(null);

  useEffect(() => {
    api.get('/admin/landlords/pending')
      .then(({ data }) => { setLandlords(data.landlords); onCountChange?.(data.landlords.length); })
      .catch(() => { setLandlords([]); onCountChange?.(0); })
      .finally(() => setLoading(false));
  }, []);

  async function act(id, action, reason = '') {
    setActing(id);
    try {
      await api.patch(`/admin/landlords/${id}/verify`, { action, reason });
      toast.success(`Landlord ${action}d`);
      setLandlords(prev => { const u = prev.filter(l => l.id !== id); onCountChange?.(u.length); return u; });
      setRejectTarget(null);
    } catch { toast.error('Action failed'); }
    finally { setActing(null); }
  }

  return (
    <div className="space-y-5">
      {lightbox && <DocLightbox url={lightbox} onClose={() => setLightbox(null)} />}
      {rejectTarget && (
        <RejectModal title="Reject Landlord" onConfirm={r => act(rejectTarget, 'reject', r)} onCancel={() => setRejectTarget(null)} />
      )}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Pending Landlords</h1>
        <p className="text-sm text-gray-400 mt-0.5">{loading ? '…' : landlords.length} awaiting identity verification</p>
      </div>
      {loading
        ? <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-44 bg-gray-100 animate-pulse rounded-2xl" />)}</div>
        : landlords.length === 0
          ? <Empty text="All landlords verified — inbox clear!" />
          : (
            <div className="space-y-4">
              {landlords.map(l => (
                <div key={l.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {(() => { const [bg, text] = avatarColor(l.name); return (
                        <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                          <span className={`${text} font-bold text-lg`}>{l.name?.[0]?.toUpperCase()}</span>
                        </div>
                      ); })()}
                      <div>
                        <p className="font-semibold text-gray-900">{l.name}</p>
                        <p className="text-gray-500 text-sm">{l.email}</p>
                        {l.phone && <p className="text-gray-500 text-sm">{l.phone}</p>}
                        <p className="text-gray-400 text-xs mt-1">
                          Registered {new Date(l.createdAt).toLocaleDateString('en-PG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => act(l.id, 'approve')}
                        disabled={acting === l.id}
                        className="bg-green-500 text-white text-sm px-4 py-2 rounded-xl hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
                      >
                        {acting === l.id ? '…' : 'Approve'}
                      </button>
                      <button
                        onClick={() => setRejectTarget(l.id)}
                        disabled={acting === l.id}
                        className="bg-red-100 text-red-600 text-sm px-4 py-2 rounded-xl hover:bg-red-200 transition-colors font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  </div>

                  {l.landlordIdDocuments?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-50">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">ID Documents</p>
                      <div className="flex flex-wrap gap-2">
                        {l.landlordIdDocuments.map(d => {
                          const isImg = /\.(jpg|jpeg|png|webp)$/i.test(d.filePath) || d.filePath.includes('/image/upload/');
                          return (
                            <button
                              key={d.id}
                              onClick={() => setLightbox(d.filePath)}
                              className="flex items-center gap-1.5 text-xs bg-secondary/10 text-secondary hover:bg-secondary/20 px-3 py-2 rounded-xl transition-colors font-medium"
                            >
                              {isImg
                                ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              }
                              {d.docType.replace(/_/g, ' ')}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
      }
    </div>
  );
}

// ─── Pending Listings ─────────────────────────────────────────────────────────
function PendingListingsSection({ onCountChange }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [acting, setActing] = useState(null);

  useEffect(() => {
    api.get('/admin/properties/pending')
      .then(({ data }) => { setProperties(data.properties); onCountChange?.(data.properties.length); })
      .catch(() => { setProperties([]); onCountChange?.(0); })
      .finally(() => setLoading(false));
  }, []);

  async function act(id, action, reason = '') {
    setActing(id);
    try {
      await api.patch(`/admin/properties/${id}/review`, { action, reason });
      toast.success(`Listing ${action}d`);
      setProperties(prev => { const u = prev.filter(p => p.id !== id); onCountChange?.(u.length); return u; });
      setRejectTarget(null);
    } catch { toast.error('Action failed'); }
    finally { setActing(null); }
  }

  return (
    <div className="space-y-5">
      {lightbox && <DocLightbox url={lightbox} onClose={() => setLightbox(null)} />}
      {rejectTarget && (
        <RejectModal title="Reject Listing" onConfirm={r => act(rejectTarget, 'reject', r)} onCancel={() => setRejectTarget(null)} />
      )}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Pending Listings</h1>
        <p className="text-sm text-gray-400 mt-0.5">{loading ? '…' : properties.length} awaiting approval</p>
      </div>
      {loading
        ? <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-56 bg-gray-100 animate-pulse rounded-2xl" />)}</div>
        : properties.length === 0
          ? <Empty text="No pending listings — inbox clear!" />
          : (
            <div className="space-y-4">
              {properties.map(p => (
                <div key={p.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${p.listingType === 'rent' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                          {p.listingType === 'rent' ? 'For Rent' : 'For Sale'}
                        </span>
                        <span className="text-xs text-gray-400 capitalize">{p.propertyType}</span>
                      </div>
                      <p className="font-semibold text-gray-900">{p.title}</p>
                      <p className="text-gray-500 text-sm mt-0.5">
                        {[p.locationGeneral, priceLabel(p.price, p.listingType, p.rentFrequency), p.bedrooms && `${p.bedrooms}bd`, p.bathrooms && `${p.bathrooms}ba`].filter(Boolean).join(' · ')}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">By {p.landlord?.name} ({p.landlord?.email})</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => act(p.id, 'approve')}
                        disabled={acting === p.id}
                        className="bg-green-500 text-white text-sm px-4 py-2 rounded-xl hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
                      >
                        {acting === p.id ? '…' : 'Approve'}
                      </button>
                      <button
                        onClick={() => setRejectTarget(p.id)}
                        disabled={acting === p.id}
                        className="bg-red-100 text-red-600 text-sm px-4 py-2 rounded-xl hover:bg-red-200 transition-colors font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  </div>

                  {p.photos?.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-3">
                      {p.photos.map(ph => (
                        <button key={ph.id} onClick={() => setLightbox(ph.filePath)} className="flex-shrink-0">
                          <img src={ph.filePath} className="w-20 h-14 object-cover rounded-xl border border-gray-100 hover:opacity-90 transition-opacity" alt="" />
                        </button>
                      ))}
                    </div>
                  )}

                  {p.titleDocuments?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Ownership Docs</p>
                      <div className="flex flex-wrap gap-2">
                        {p.titleDocuments.map(d => (
                          <button
                            key={d.id}
                            onClick={() => setLightbox(d.filePath)}
                            className="flex items-center gap-1.5 text-xs bg-secondary/10 text-secondary hover:bg-secondary/20 px-3 py-1.5 rounded-xl transition-colors font-medium"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            {d.docType}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {p.amenities?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {p.amenities.map(a => (
                        <span key={a.id} className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">{a.amenityName}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
      }
    </div>
  );
}

// ─── All Landlords ────────────────────────────────────────────────────────────
function AllLandlordsSection() {
  const [landlords, setLandlords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [acting, setActing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    api.get('/admin/landlords')
      .then(({ data }) => setLandlords(data.landlords))
      .catch(() => setLandlords([]))
      .finally(() => setLoading(false));
  }, []);

  async function suspend(id) {
    setActing(id + '_s');
    try {
      const { data } = await api.patch(`/admin/landlords/${id}/suspend`);
      setLandlords(prev => prev.map(l => l.id === id ? { ...l, status: data.status } : l));
      toast.success(data.status === 'suspended' ? 'Landlord suspended' : 'Landlord reactivated');
    } catch { toast.error('Action failed'); }
    finally { setActing(null); }
  }

  async function remove(id) {
    setActing(id + '_d');
    try {
      await api.delete(`/admin/landlords/${id}`);
      setLandlords(prev => prev.filter(l => l.id !== id));
      toast.success('Landlord deleted');
      setConfirmDelete(null);
    } catch { toast.error('Delete failed'); }
    finally { setActing(null); }
  }

  const filtered = landlords.filter(l =>
    !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-2">Delete Landlord?</h3>
            <p className="text-sm text-gray-500 mb-4">This permanently deletes the landlord and all their listings, messages and transaction records. This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-semibold hover:bg-red-600 text-sm disabled:opacity-50"
                onClick={() => remove(confirmDelete)}
                disabled={acting === confirmDelete + '_d'}
              >
                {acting === confirmDelete + '_d' ? '…' : 'Delete'}
              </button>
              <button className="flex-1 btn-outline text-sm" onClick={() => setConfirmDelete(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">All Landlords</h1>
          <p className="text-sm text-gray-400 mt-0.5">{landlords.length} registered</p>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input className="input pl-9 pr-4 py-2.5 text-sm w-full sm:w-64" placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading
        ? <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-2xl" />)}</div>
        : filtered.length === 0
          ? <Empty text={search ? 'No landlords match your search' : 'No landlords yet'} />
          : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-50">
                {filtered.map(l => (
                  <div key={l.id} className="flex items-center justify-between gap-3 px-5 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {(() => { const [bg, text] = avatarColor(l.name); return (
                        <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <span className={`${text} font-bold text-sm`}>{l.name?.[0]?.toUpperCase()}</span>
                        </div>
                      ); })()}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{l.name}</p>
                        <p className="text-gray-400 text-xs truncate">{l.email}</p>
                        <p className="text-gray-400 text-xs">{l.properties?.length || 0} listing{l.properties?.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={l.status} />
                      <button
                        onClick={() => suspend(l.id)}
                        disabled={acting === l.id + '_s'}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                          l.status === 'suspended'
                            ? 'border-green-200 text-green-600 hover:bg-green-50'
                            : 'border-amber-200 text-amber-600 hover:bg-amber-50'
                        }`}
                      >
                        {acting === l.id + '_s' ? '…' : l.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(l.id)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
      }
    </div>
  );
}

// ─── All Listings ─────────────────────────────────────────────────────────────
function AllListingsSection() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [acting, setActing] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  useEffect(() => {
    api.get('/admin/properties')
      .then(({ data }) => setProperties(data.properties))
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, []);

  async function reviewProp(id, action, reason = '') {
    setActing(id + '_' + action);
    try {
      const { data } = await api.patch(`/admin/properties/${id}/review`, { action, reason });
      setProperties(prev => prev.map(p => p.id === id ? { ...p, status: data.property.status } : p));
      toast.success(`Listing ${action}d`);
      setRejectTarget(null);
    } catch { toast.error('Action failed'); }
    finally { setActing(null); }
  }

  async function deleteProp(id) {
    if (!window.confirm('Delete this listing permanently?')) return;
    setActing(id + '_delete');
    try {
      await api.delete(`/properties/${id}`);
      setProperties(prev => prev.filter(p => p.id !== id));
      toast.success('Listing deleted');
    } catch { toast.error('Delete failed'); }
    finally { setActing(null); }
  }

  const filtered = properties.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !search || p.title?.toLowerCase().includes(q) || p.landlord?.name?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      {rejectTarget && (
        <RejectModal title="Reject Listing" onConfirm={r => reviewProp(rejectTarget, 'reject', r)} onCancel={() => setRejectTarget(null)} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">All Listings</h1>
          <p className="text-sm text-gray-400 mt-0.5">{properties.length} total</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input className="input pl-9 pr-4 py-2.5 text-sm w-full sm:w-44" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input py-2.5 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading
        ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-2xl" />)}</div>
        : filtered.length === 0
          ? <Empty text="No listings match your filters" />
          : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-50">
                {filtered.map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                    {p.photos?.[0]
                      ? <img src={p.photos[0].filePath} className="w-12 h-9 object-cover rounded-xl flex-shrink-0" alt="" />
                      : <div className="w-12 h-9 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center"><svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg></div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{p.title}</p>
                      <p className="text-gray-400 text-xs truncate">{p.locationGeneral} · By {p.landlord?.name}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={p.status} />
                      {p.status === 'pending' && (
                        <>
                          <button onClick={() => reviewProp(p.id, 'approve')} disabled={!!acting} className="text-xs px-2.5 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors font-medium">Approve</button>
                          <button onClick={() => setRejectTarget(p.id)} className="text-xs px-2.5 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors font-medium">Reject</button>
                        </>
                      )}
                      <button onClick={() => deleteProp(p.id)} disabled={acting === p.id + '_delete'} className="text-xs px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
                        {acting === p.id + '_delete' ? '…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
      }
    </div>
  );
}

// ─── Transactions ─────────────────────────────────────────────────────────────
function TransactionsSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/transactions')
      .then(({ data: d }) => setData(d))
      .catch(() => setData({ transactions: [], totalRevenue: 0, thisMonthRevenue: 0, totalCount: 0 }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Transactions</h1>
        <p className="text-sm text-gray-400 mt-0.5">All platform payment records</p>
      </div>

      {loading
        ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-2xl" />)}</div>
        : !data ? null
        : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Total Revenue', value: `K${Number(data.totalRevenue).toLocaleString()}` },
                { label: 'This Month', value: `K${Number(data.thisMonthRevenue).toLocaleString()}` },
                { label: 'Total Transactions', value: data.totalCount },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {data.transactions.length === 0
              ? <Empty text="No transactions yet" />
              : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-50">
                        {['Date', 'Tenant', 'Property', 'Amount', 'Status'].map(h => (
                          <th key={h} className={`px-5 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide text-left ${h === 'Amount' ? 'text-right' : ''} ${h === 'Property' ? 'hidden sm:table-cell' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.transactions.map(t => (
                        <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3 text-gray-400 whitespace-nowrap">
                            {new Date(t.createdAt).toLocaleDateString('en-PG', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-5 py-3">
                            <p className="font-medium text-gray-900">{t.tenant?.name}</p>
                            <p className="text-gray-400 text-xs">{t.tenant?.email}</p>
                          </td>
                          <td className="px-5 py-3 text-gray-500 hidden sm:table-cell max-w-[200px] truncate">{t.property?.title}</td>
                          <td className="px-5 py-3 text-right font-semibold text-gray-900">K{Number(t.amount).toLocaleString()}</td>
                          <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </>
        )
      }
    </div>
  );
}

// ─── Messages ─────────────────────────────────────────────────────────────────
function MessagesSection() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/messages')
      .then(({ data }) => setThreads(data.threads))
      .catch(() => setThreads([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Messages</h1>
        <p className="text-sm text-gray-400 mt-0.5">{loading ? '…' : threads.length} active conversation threads</p>
      </div>

      {loading
        ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-2xl" />)}</div>
        : threads.length === 0
          ? <Empty text="No messages yet" />
          : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-50">
                {threads.map(t => (
                  <div key={t.key} className="flex items-start gap-4 px-5 py-4">
                    <div className="w-9 h-9 bg-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-gray-900 text-sm">{t.participants.join(' ↔ ')}</p>
                        <p className="text-gray-400 text-xs flex-shrink-0">{timeAgo(t.lastMessage.sentAt)}</p>
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5 truncate">{t.property?.title}</p>
                      <p className="text-gray-400 text-xs mt-0.5 truncate">{t.lastMessage.senderName}: {t.lastMessage.content}</p>
                    </div>
                    <span className="flex-shrink-0 bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full">
                      {t.messageCount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
      }
    </div>
  );
}

// ─── Security / 2FA ───────────────────────────────────────────────────────────
function SecuritySection() {
  const [status, setStatus] = useState('idle'); // 'idle' | 'setup' | 'done' | 'disabling'
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => setTwoFaEnabled(!!data.user.twoFactorEnabled))
      .catch(() => {})
      .finally(() => setFetched(true));
  }, []);

  async function startSetup() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/2fa/setup');
      setQrDataUrl(data.qrDataUrl);
      setSecret(data.secret);
      setStatus('setup');
      setConfirmCode('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start 2FA setup');
    } finally {
      setLoading(false);
    }
  }

  async function confirmSetup(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/admin/2fa/confirm', { code: confirmCode });
      setBackupCode(data.backupCode);
      setTwoFaEnabled(true);
      setStatus('done');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid code — try again');
      setConfirmCode('');
    } finally {
      setLoading(false);
    }
  }

  async function disable2fa(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/2fa/disable', { code: disableCode });
      setTwoFaEnabled(false);
      setStatus('idle');
      setDisableCode('');
      setQrDataUrl('');
      setSecret('');
      setBackupCode('');
      toast.success('Two-factor authentication disabled');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid code');
      setDisableCode('');
    } finally {
      setLoading(false);
    }
  }

  if (!fetched) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Security</h1>
          <p className="text-sm text-gray-400 mt-0.5">Two-factor authentication settings</p>
        </div>
        <div className="h-32 bg-gray-100 animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Security</h1>
        <p className="text-sm text-gray-400 mt-0.5">Two-factor authentication settings for your admin account</p>
      </div>

      {/* Status banner */}
      <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${twoFaEnabled ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${twoFaEnabled ? 'bg-green-100' : 'bg-amber-100'}`}>
          <svg className={`w-5 h-5 ${twoFaEnabled ? 'text-green-600' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {twoFaEnabled
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            }
          </svg>
        </div>
        <div>
          <p className={`font-semibold text-sm ${twoFaEnabled ? 'text-green-800' : 'text-amber-800'}`}>
            {twoFaEnabled ? '2FA is enabled' : '2FA is not enabled'}
          </p>
          <p className={`text-xs mt-0.5 ${twoFaEnabled ? 'text-green-600' : 'text-amber-600'}`}>
            {twoFaEnabled
              ? 'Your account is protected with time-based one-time passwords.'
              : 'Enable two-factor authentication to add an extra layer of security.'}
          </p>
        </div>
      </div>

      {/* Setup flow */}
      {status === 'idle' && !twoFaEnabled && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Enable Two-Factor Authentication</h2>
          <p className="text-sm text-gray-400 mb-5">
            Use an authenticator app like Google Authenticator or Authy to generate one-time codes.
          </p>
          <button className="btn-primary" onClick={startSetup} disabled={loading}>
            {loading ? 'Loading…' : 'Set up 2FA'}
          </button>
        </div>
      )}

      {status === 'setup' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-gray-900 mb-1">Scan QR Code</h2>
            <p className="text-sm text-gray-400">Open your authenticator app and scan the QR code below.</p>
          </div>
          {qrDataUrl && (
            <div className="flex justify-center">
              <img src={qrDataUrl} alt="2FA QR code" className="w-48 h-48 border border-gray-200 rounded-xl p-2" />
            </div>
          )}
          {secret && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Or enter the key manually:</p>
              <code className="block bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-700 tracking-widest select-all break-all">
                {secret}
              </code>
            </div>
          )}
          <form onSubmit={confirmSetup} className="space-y-3">
            <div>
              <label className="label">Enter the 6-digit code to confirm</label>
              <input
                className="input text-center text-2xl tracking-widest font-mono"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                autoFocus
                value={confirmCode}
                onChange={e => setConfirmCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
              />
            </div>
            <div className="flex gap-3">
              <button className="btn-primary flex-1" disabled={loading || confirmCode.length !== 6}>
                {loading ? 'Verifying…' : 'Enable 2FA'}
              </button>
              <button
                type="button"
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                onClick={() => { setStatus('idle'); setQrDataUrl(''); setSecret(''); setConfirmCode(''); }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {status === 'done' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h2 className="font-semibold text-gray-900">2FA enabled successfully!</h2>
          </div>
          <div>
            <p className="text-sm text-amber-700 font-medium mb-1">Save your backup code — it is shown only once.</p>
            <p className="text-xs text-gray-400 mb-2">
              Use this code to access your account if you lose your authenticator device. It is single-use.
            </p>
            <code className="block bg-gray-900 text-green-400 font-mono text-lg tracking-widest text-center rounded-xl px-4 py-4 select-all">
              {backupCode}
            </code>
          </div>
          <button
            className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            onClick={() => setStatus('idle')}
          >
            Done
          </button>
        </div>
      )}

      {/* Disable flow */}
      {twoFaEnabled && status === 'idle' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Disable Two-Factor Authentication</h2>
          <p className="text-sm text-gray-400 mb-5">
            You will need your current authenticator code to disable 2FA.
          </p>
          <button
            className="px-4 py-2 rounded-xl border border-red-200 text-sm text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => setStatus('disabling')}
          >
            Disable 2FA
          </button>
        </div>
      )}

      {status === 'disabling' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Confirm Disable 2FA</h2>
          <form onSubmit={disable2fa} className="space-y-3">
            <div>
              <label className="label">Enter your 6-digit authenticator code</label>
              <input
                className="input text-center text-2xl tracking-widest font-mono"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                autoFocus
                value={disableCode}
                onChange={e => setDisableCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
              />
            </div>
            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                disabled={loading || disableCode.length !== 6}
              >
                {loading ? 'Disabling…' : 'Confirm Disable'}
              </button>
              <button
                type="button"
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                onClick={() => { setStatus('idle'); setDisableCode(''); }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
