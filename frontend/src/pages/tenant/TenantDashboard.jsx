import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ── Brand tokens ──────────────────────────────────────────────────────────────
const BROWN     = '#41271B';
const CLAY      = '#975536';
const CLAY_TINT = '#FBEEE7';
const MUTED     = '#6A6A6A';
const DIVIDER   = '#EBEBEB';

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── SVG icon primitives ───────────────────────────────────────────────────────
function KeyIcon({ size = 24, color = 'currentColor', sw = 1.7 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8.5" cy="14.5" r="4.5" />
      <path d="m12.7 10.3 6.3-6.3" />
      <path d="m19 4 1 1" />
      <path d="m16 4 3 3" />
    </svg>
  );
}

function HeartIcon({ size = 24, color = 'currentColor', sw = 1.7 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function ChatIcon({ size = 24, color = 'currentColor', sw = 1.7 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function HomeIcon({ size = 24, color = 'currentColor', sw = 1.7 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function UserIcon({ size = 24, color = 'currentColor', sw = 1.7 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

// ── Shared card shell ─────────────────────────────────────────────────────────
const cardStyle = {
  backgroundColor: '#fff',
  borderRadius: 16,
  border: `1px solid ${DIVIDER}`,
  boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
};

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '52px 24px 40px', textAlign: 'center' }}>
      <div style={{
        width: 100, height: 100, borderRadius: '50%',
        backgroundColor: CLAY_TINT,
        boxShadow: '0 6px 28px rgba(151,85,54,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 28, flexShrink: 0,
      }}>
        <HeartIcon size={46} color={CLAY} sw={1.5} />
      </div>

      <h2 style={{ color: BROWN, fontSize: 20, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.3px' }}>
        No saved properties
      </h2>
      <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.65, maxWidth: 270, margin: '0 0 32px' }}>
        Tap the heart icon on any listing to save it here for later.
      </p>

      <Link
        to="/"
        style={{
          display: 'inline-block', textDecoration: 'none',
          backgroundColor: CLAY, color: '#fff',
          fontWeight: 700, fontSize: 15,
          padding: '14px 36px', borderRadius: 12,
          boxShadow: '0 4px 18px rgba(151,85,54,0.30)',
          fontFamily: 'inherit',
        }}
      >
        Start browsing
      </Link>
    </div>
  );
}

// ── Property card ─────────────────────────────────────────────────────────────
function PropertyRow({ property, onRemove }) {
  const photo = property?.photos?.[0];
  const isAvailable = property?.status === 'active';
  const unavailableLabel = property?.status === 'rented' ? 'Rented' : 'No longer available';

  const inner = (
    <>
      {photo ? (
        <img src={photo.filePath} style={{ width: 80, height: 64, objectFit: 'cover', borderRadius: 10, flexShrink: 0, opacity: isAvailable ? 1 : 0.5 }} alt="" />
      ) : (
        <div style={{ width: 80, height: 64, borderRadius: 10, flexShrink: 0, backgroundColor: CLAY_TINT, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isAvailable ? 1 : 0.5 }}>
          <HomeIcon size={28} color={CLAY} sw={1.5} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, color: isAvailable ? BROWN : MUTED, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 0 2px' }}>
          {property.title}
        </p>
        {!isAvailable && (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#B45309', backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: 20, display: 'inline-block', marginBottom: 4 }}>
            {unavailableLabel}
          </span>
        )}
        <p style={{ color: MUTED, fontSize: 13, margin: '0 0 2px' }}>📍 {property.locationGeneral}</p>
        <p style={{ color: isAvailable ? CLAY : MUTED, fontWeight: 700, fontSize: 14, margin: 0 }}>K{Number(property.price).toLocaleString()}</p>
      </div>
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
        title="Remove from saved"
        style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${DIVIDER}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2} strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </>
  );

  const rowStyle = { ...cardStyle, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', textDecoration: 'none' };

  if (isAvailable) {
    return <Link to={`/property/${property.id}`} style={rowStyle}>{inner}</Link>;
  }
  return <div style={rowStyle}>{inner}</div>;
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function TenantDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    api.get('/tenant/favorites')
      .then(res => setFavorites(res.data.favorites || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const NAV_ITEMS = [
    { key: 'browse',   label: 'Browse',   Icon: HomeIcon,  action: () => navigate('/') },
    { key: 'saved',    label: 'Saved',    Icon: HeartIcon, action: () => {} },
    { key: 'messages', label: 'Messages', Icon: ChatIcon,  action: () => navigate('/tenant/messages') },
    { key: 'account',  label: 'Account',  Icon: UserIcon,  action: () => {} },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', fontFamily: "'Inter', sans-serif", paddingBottom: 80 }}>

      {/* ── Sticky header ──────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50, backgroundColor: '#fff',
        borderBottom: `1px solid ${DIVIDER}`,
        height: 64, padding: '0 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <img src="/logo.svg" alt="HausFindrr" style={{ width: 34, height: 34 }} />
          <span style={{ fontSize: 20, fontWeight: 800, color: BROWN, letterSpacing: '-0.5px' }}>HausFindrr</span>
        </Link>

        <button
          onClick={() => setMenuOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            border: `1px solid ${DIVIDER}`, borderRadius: 40,
            padding: '6px 8px 6px 14px', backgroundColor: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.09)', cursor: 'pointer',
          }}
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke={BROWN} strokeWidth={1.8} strokeLinecap="round">
            <line x1="0" y1="1" x2="18" y2="1" />
            <line x1="0" y1="7" x2="18" y2="7" />
            <line x1="0" y1="13" x2="18" y2="13" />
          </svg>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', backgroundColor: CLAY,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 14, lineHeight: 1,
          }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </button>
      </header>

      {/* ── Dropdown menu ──────────────────────────────────────────────────── */}
      {menuOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 90 }}
            onClick={() => setMenuOpen(false)}
          />
          <div style={{
            position: 'fixed', top: 72, right: 16, zIndex: 100,
            backgroundColor: '#fff', borderRadius: 16,
            border: `1px solid ${DIVIDER}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
            minWidth: 210, overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${DIVIDER}` }}>
              <p style={{ fontWeight: 700, color: BROWN, fontSize: 14, margin: 0 }}>{user?.name}</p>
              <p style={{ color: MUTED, fontSize: 12, marginTop: 3, marginBottom: 0 }}>{user?.email}</p>
            </div>
            <button
              onClick={() => { setMenuOpen(false); logout(); navigate('/'); }}
              style={{
                width: '100%', padding: '13px 18px', textAlign: 'left',
                color: '#C0392B', fontWeight: 600, fontSize: 14,
                background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Sign out
            </button>
          </div>
        </>
      )}

      {/* ── Page title ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '24px 20px 0' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: BROWN, letterSpacing: '-0.5px', margin: '0 0 4px' }}>
          Saved homes
        </h1>
        <p style={{ color: MUTED, fontSize: 14, margin: 0 }}>
          Hi, {user?.name?.split(' ')[0]}
        </p>
      </div>

      {/* ── Tab content ────────────────────────────────────────────────────── */}
      <div style={{ padding: '20px 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: 64, color: MUTED, fontSize: 14 }}>Loading…</div>
        ) : favorites.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {favorites.map(f => (
              <PropertyRow
                key={f.id}
                property={f.property}
                onRemove={async () => {
                  try {
                    await api.post(`/tenant/favorite/${f.property.id}`);
                    setFavorites(prev => prev.filter(x => x.id !== f.id));
                  } catch {
                    // silent — user can retry
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom navigation ──────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        backgroundColor: '#fff', borderTop: `1px solid ${DIVIDER}`,
        display: 'flex', paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {NAV_ITEMS.map(({ key, label, Icon, action }) => {
          const active = key === 'account' || key === 'saved';
          return (
            <button
              key={key}
              onClick={action}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '10px 0 8px', gap: 4,
                background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Icon size={22} color={active ? BROWN : '#C5C5C5'} sw={active ? 2.2 : 1.6} />
              <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? BROWN : '#C5C5C5' }}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
