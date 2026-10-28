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

function MegaphoneIcon({ size = 24, color = 'currentColor', sw = 1.7 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5.882V19.24a1.76 1.76 0 0 1-3.417.592l-2.147-6.15M18 13a3 3 0 1 0 0-6M5.436 13.683A4.001 4.001 0 0 1 7 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 0 1-1.564-.317z" />
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
const EMPTY_CONFIG = {
  unlocked: {
    Icon: KeyIcon,
    heading: 'Nothing unlocked yet',
    body: 'Browse listings and unlock a property to see full details and contact the landlord.',
    cta: 'Browse listings',
    ctaLink: '/',
    secondary: 'How unlocking works',
  },
  saved: {
    Icon: HeartIcon,
    heading: 'No saved properties',
    body: 'Tap the heart icon on any listing to save it here for later.',
    cta: 'Start browsing',
    ctaLink: '/',
    secondary: 'Learn about favourites',
  },
  messages: {
    Icon: ChatIcon,
    heading: 'No messages yet',
    body: 'Unlock a property to start a conversation with the landlord.',
    cta: 'Find a property',
    ctaLink: '/',
    secondary: 'How messaging works',
  },
};

function EmptyState({ tabKey }) {
  const { Icon, heading, body, cta, ctaLink, secondary } = EMPTY_CONFIG[tabKey];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '52px 24px 40px', textAlign: 'center' }}>
      {/* Icon badge */}
      <div style={{
        width: 100, height: 100, borderRadius: '50%',
        backgroundColor: CLAY_TINT,
        boxShadow: '0 6px 28px rgba(151,85,54,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 28, flexShrink: 0,
      }}>
        <Icon size={46} color={CLAY} sw={1.5} />
      </div>

      <h2 style={{ color: BROWN, fontSize: 20, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.3px' }}>
        {heading}
      </h2>
      <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.65, maxWidth: 270, margin: '0 0 32px' }}>
        {body}
      </p>

      {/* Primary CTA */}
      <Link
        to={ctaLink}
        style={{
          display: 'inline-block', textDecoration: 'none',
          backgroundColor: CLAY, color: '#fff',
          fontWeight: 700, fontSize: 15,
          padding: '14px 36px', borderRadius: 12,
          boxShadow: '0 4px 18px rgba(151,85,54,0.30)',
          marginBottom: 20, fontFamily: 'inherit',
        }}
      >
        {cta}
      </Link>

      {/* Secondary link */}
      <button
        style={{
          background: 'none', border: 'none',
          color: BROWN, fontWeight: 600, fontSize: 14,
          textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        {secondary}
      </button>
    </div>
  );
}

// ── Property card ─────────────────────────────────────────────────────────────
function PropertyRow({ property, badge, isUnlocked }) {
  const photo = property?.photos?.[0];
  return (
    <Link
      to={`/property/${property.id}`}
      style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', textDecoration: 'none' }}
    >
      {photo ? (
        <img src={photo.filePath} style={{ width: 80, height: 64, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} alt="" />
      ) : (
        <div style={{ width: 80, height: 64, borderRadius: 10, flexShrink: 0, backgroundColor: CLAY_TINT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HomeIcon size={28} color={CLAY} sw={1.5} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <p style={{ fontWeight: 700, color: BROWN, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, margin: 0 }}>
            {property.title}
          </p>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, flexShrink: 0,
            backgroundColor: isUnlocked ? '#E6F4EA' : CLAY_TINT,
            color: isUnlocked ? '#1E7E34' : CLAY,
          }}>
            {badge}
          </span>
        </div>
        <p style={{ color: MUTED, fontSize: 13, margin: '0 0 3px' }}>📍 {property.locationGeneral}</p>
        <p style={{ color: CLAY, fontWeight: 700, fontSize: 14, margin: 0 }}>K{Number(property.price).toLocaleString()}</p>
      </div>
    </Link>
  );
}

// ── Message rows ──────────────────────────────────────────────────────────────
function NotificationRow({ notification }) {
  return (
    <div style={{ ...cardStyle, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: CLAY_TINT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <MegaphoneIcon size={20} color={CLAY} sw={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <p style={{ fontWeight: 700, color: BROWN, fontSize: 14, margin: 0 }}>HausFindrr Support</p>
          <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: CLAY_TINT, color: CLAY, padding: '2px 8px', borderRadius: 20 }}>Official</span>
        </div>
        <div style={{ backgroundColor: '#F8F7F5', borderRadius: 12, padding: '10px 14px' }}>
          <p style={{ fontWeight: 700, color: BROWN, fontSize: 13, margin: '0 0 4px' }}>{notification.title}</p>
          <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.6, margin: 0 }}>{notification.content}</p>
        </div>
        <p style={{ color: '#B0B0B0', fontSize: 12, margin: '6px 0 0' }}>{timeAgo(notification.createdAt)}</p>
      </div>
    </div>
  );
}

function AnnouncementRow({ announcement }) {
  return (
    <div style={{ ...cardStyle, backgroundColor: '#FFF9F6', borderColor: CLAY_TINT, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: CLAY_TINT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <MegaphoneIcon size={20} color={CLAY} sw={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <p style={{ fontWeight: 700, color: BROWN, fontSize: 14, margin: 0 }}>HausFindrr Team</p>
          <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: CLAY_TINT, color: CLAY, padding: '2px 8px', borderRadius: 20 }}>Announcement</span>
        </div>
        <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.6, margin: 0 }}>{announcement.content}</p>
        <p style={{ color: '#B0B0B0', fontSize: 12, margin: '6px 0 0' }}>{timeAgo(announcement.createdAt)}</p>
      </div>
    </div>
  );
}

function DirectMessageRow({ thread }) {
  const [expanded, setExpanded] = useState(false);
  const isHausFindrr = thread.otherUser?.role === 'admin';
  const senderName = isHausFindrr ? 'HausFindrr Support' : (thread.otherUser?.name || 'Admin');

  return (
    <div style={{ ...cardStyle, overflow: 'hidden' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
      >
        <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: CLAY_TINT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ChatIcon size={20} color={CLAY} sw={1.8} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <p style={{ fontWeight: 700, color: BROWN, fontSize: 14, margin: 0 }}>{senderName}</p>
            {isHausFindrr && (
              <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: CLAY_TINT, color: CLAY, padding: '2px 8px', borderRadius: 20 }}>Official</span>
            )}
            {thread.unreadCount > 0 && (
              <span style={{ backgroundColor: CLAY, color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{thread.unreadCount} new</span>
            )}
          </div>
          <p style={{ color: MUTED, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
            {thread.latestMessage?.content}
          </p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2} strokeLinecap="round"
          style={{ flexShrink: 0, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div style={{ borderTop: `1px solid ${DIVIDER}`, padding: '14px 16px' }}>
          <div style={{ backgroundColor: '#F8F7F5', borderRadius: 12, padding: '12px 16px' }}>
            <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.65, whiteSpace: 'pre-line', margin: 0 }}>
              {thread.latestMessage?.content}
            </p>
          </div>
          <p style={{ color: '#B0B0B0', fontSize: 12, margin: '8px 0 0' }}>{timeAgo(thread.latestMessage?.sentAt)}</p>
        </div>
      )}
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function TenantDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('unlocked');
  const [unlocked, setUnlocked] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [threads, setThreads] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      api.get('/tenant/unlocked'),
      api.get('/tenant/favorites'),
      api.get('/messages/inbox'),
      api.get('/announcements'),
      api.get('/notifications'),
    ]).then(([u, f, m, a, n]) => {
      if (u.status === 'fulfilled') setUnlocked(u.value.data.unlocks || []);
      if (f.status === 'fulfilled') setFavorites(f.value.data.favorites || []);
      if (m.status === 'fulfilled') setThreads(m.value.data.threads || []);
      if (a.status === 'fulfilled') setAnnouncements(a.value.data.announcements || []);
      if (n.status === 'fulfilled') setNotifications(n.value.data.notifications || []);
    }).finally(() => setLoading(false));
  }, []);

  const messageCount = threads.length + announcements.length + notifications.length;

  const TABS = [
    { key: 'unlocked', label: 'Unlocked', Icon: KeyIcon,   count: unlocked.length },
    { key: 'saved',    label: 'Saved',    Icon: HeartIcon, count: favorites.length },
    { key: 'messages', label: 'Messages', Icon: ChatIcon,  count: messageCount },
  ];

  const NAV_ITEMS = [
    { key: 'browse',   label: 'Browse',   Icon: HomeIcon,  action: () => navigate('/') },
    { key: 'saved',    label: 'Saved',    Icon: HeartIcon, action: () => setTab('saved') },
    { key: 'messages', label: 'Messages', Icon: ChatIcon,  action: () => setTab('messages') },
    { key: 'account',  label: 'Account',  Icon: UserIcon,  action: () => setTab('unlocked') },
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
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <img src="/logo.svg" alt="HausFindrr" style={{ width: 34, height: 34 }} />
          <span style={{ fontSize: 20, fontWeight: 800, color: BROWN, letterSpacing: '-0.5px' }}>HausFindrr</span>
        </Link>

        {/* Pill button: hamburger + avatar */}
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
          {/* Click-away overlay */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 90 }}
            onClick={() => setMenuOpen(false)}
          />
          {/* Menu */}
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
          Your account
        </h1>
        <p style={{ color: MUTED, fontSize: 14, margin: 0 }}>
          Hi, {user?.name?.split(' ')[0]}
        </p>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 24, borderBottom: `1px solid ${DIVIDER}` }}>
        <div style={{ display: 'flex', paddingLeft: 12 }}>
          {TABS.map(({ key, label, Icon, count }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 5, padding: '6px 16px 12px', background: 'none', border: 'none',
                  borderBottom: active ? `2.5px solid ${BROWN}` : '2.5px solid transparent',
                  marginBottom: -1, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <Icon size={20} color={active ? BROWN : '#C0C0C0'} sw={active ? 2.1 : 1.7} />
                <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? BROWN : '#C0C0C0', whiteSpace: 'nowrap' }}>
                  {label}{count > 0 ? ` (${count})` : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab content ────────────────────────────────────────────────────── */}
      <div style={{ padding: '20px 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: 64, color: MUTED, fontSize: 14 }}>Loading…</div>
        ) : (
          <>
            {/* Unlocked */}
            {tab === 'unlocked' && (
              unlocked.length === 0 ? <EmptyState tabKey="unlocked" /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {unlocked.map(u => (
                    <PropertyRow key={u.id} property={u.property} badge="Unlocked" isUnlocked />
                  ))}
                </div>
              )
            )}

            {/* Saved */}
            {tab === 'saved' && (
              favorites.length === 0 ? <EmptyState tabKey="saved" /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {favorites.map(f => (
                    <PropertyRow key={f.id} property={f.property} badge="Saved" isUnlocked={false} />
                  ))}
                </div>
              )
            )}

            {/* Messages */}
            {tab === 'messages' && (
              messageCount === 0 ? <EmptyState tabKey="messages" /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {notifications.map(n => (
                    <NotificationRow key={n.id} notification={n} />
                  ))}
                  {announcements.map(a => (
                    <AnnouncementRow key={a.id} announcement={a} />
                  ))}
                  {threads.map((t, i) => (
                    t.isDirect ? (
                      <DirectMessageRow key={i} thread={t} />
                    ) : (
                      <Link key={i} to={`/property/${t.propertyId}`} style={{
                        ...cardStyle, display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 16px', textDecoration: 'none',
                      }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: CLAY_TINT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <ChatIcon size={20} color={CLAY} sw={1.8} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, color: BROWN, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 0 3px' }}>
                            {t.property?.title}
                          </p>
                          <p style={{ color: MUTED, fontSize: 13, margin: '0 0 2px' }}>With {t.otherUser?.name}</p>
                          <p style={{ color: '#B0B0B0', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                            {t.latestMessage?.content}
                          </p>
                        </div>
                        {t.unreadCount > 0 && (
                          <span style={{ backgroundColor: CLAY, color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, flexShrink: 0 }}>
                            {t.unreadCount}
                          </span>
                        )}
                      </Link>
                    )
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* ── Bottom navigation ──────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        backgroundColor: '#fff', borderTop: `1px solid ${DIVIDER}`,
        display: 'flex', paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {NAV_ITEMS.map(({ key, label, Icon, action }) => {
          // Account is always the active bottom-nav item since this IS the account page
          const active = key === 'account';
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
