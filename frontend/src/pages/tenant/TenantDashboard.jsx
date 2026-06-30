import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/shared/Navbar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function TenantDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('unlocked');
  const [unlocked, setUnlocked] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [threads, setThreads] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/tenant/unlocked'),
      api.get('/tenant/favorites'),
      api.get('/messages/inbox'),
      api.get('/announcements'),
      api.get('/notifications'),
    ]).then(([u, f, m, a, n]) => {
      setUnlocked(u.data.unlocks);
      setFavorites(f.data.favorites);
      setThreads(m.data.threads);
      setAnnouncements(a.data.announcements || []);
      setNotifications(n.data.notifications || []);
    }).finally(() => setLoading(false));
  }, []);

  const messageCount = threads.length + announcements.length + notifications.length;

  const TABS = [
    { key: 'unlocked',  label: `Unlocked (${unlocked.length})` },
    { key: 'favorites', label: `Favorites (${favorites.length})` },
    { key: 'messages',  label: `Messages (${messageCount})` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">Hi, {user?.name}</h1>
            <p className="text-gray-500 text-sm">Your property dashboard</p>
          </div>
          <Link to="/" className="btn-secondary text-sm px-4 py-2">Browse More</Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-primary'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? <p className="text-gray-400">Loading…</p> : (
          <>
            {tab === 'unlocked' && (
              unlocked.length === 0 ? (
                <EmptyState icon="🔓" text="No unlocked properties yet. Unlock a listing to see full details." link="/" linkText="Browse listings" />
              ) : (
                <div className="space-y-4">
                  {unlocked.map(u => <PropertyRow key={u.id} property={u.property} badge="Unlocked" badgeColor="bg-green-100 text-green-700" />)}
                </div>
              )
            )}

            {tab === 'favorites' && (
              favorites.length === 0 ? (
                <EmptyState icon="❤️" text="No saved properties yet. Tap the heart icon on any listing." link="/" linkText="Browse listings" />
              ) : (
                <div className="space-y-4">
                  {favorites.map(f => <PropertyRow key={f.id} property={f.property} badge="Saved" badgeColor="bg-red-100 text-red-600" />)}
                </div>
              )
            )}

            {tab === 'messages' && (
              messageCount === 0 ? (
                <EmptyState icon="💬" text="No conversations yet. Unlock a property to start chatting." />
              ) : (
                <div className="space-y-3">
                  {/* Welcome & system notifications */}
                  {notifications.map(n => (
                    <NotificationRow key={n.id} notification={n} />
                  ))}
                  {/* Announcements from HausFindrr Team */}
                  {announcements.map(a => (
                    <AnnouncementRow key={a.id} announcement={a} />
                  ))}
                  {/* Regular message threads */}
                  {threads.map((t, i) => (
                    t.isDirect ? (
                      <DirectMessageRow key={i} thread={t} />
                    ) : (
                      <Link key={i} to={`/property/${t.propertyId}`} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-xl">💬</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{t.property?.title}</p>
                          <p className="text-gray-500 text-sm">With {t.otherUser?.name}</p>
                          <p className="text-gray-400 text-xs truncate">{t.latestMessage?.content}</p>
                        </div>
                        {t.unreadCount > 0 && (
                          <span className="flex-shrink-0 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
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
    </div>
  );
}

const NOTIFICATION_ICONS = {
  welcome: '👋',
  privacy_policy: '🔒',
  terms: '📋',
};

function NotificationRow({ notification }) {
  return (
    <div className="card p-4 flex items-start gap-4 border-l-4 border-blue-300 bg-blue-50/60">
      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-xl">
        {NOTIFICATION_ICONS[notification.type] || '📩'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold text-blue-800 text-sm">{notification.title}</p>
          <span className="text-xs text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded-full">HausFindrr</span>
        </div>
        <p className="text-gray-700 text-sm leading-relaxed">{notification.content}</p>
        <p className="text-gray-400 text-xs mt-1">{timeAgo(notification.createdAt)}</p>
      </div>
    </div>
  );
}

function AnnouncementRow({ announcement }) {
  return (
    <div className="card p-4 flex items-start gap-4 border-l-4 border-primary/40 bg-primary/5">
      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold text-primary text-sm">HausFindrr Team</p>
          <span className="text-xs text-primary/60 bg-primary/10 px-1.5 py-0.5 rounded-full">Announcement</span>
        </div>
        <p className="text-gray-700 text-sm leading-relaxed">{announcement.content}</p>
        <p className="text-gray-400 text-xs mt-1">{timeAgo(announcement.createdAt)}</p>
      </div>
    </div>
  );
}

function DirectMessageRow({ thread }) {
  return (
    <div className="card p-4 flex items-center gap-4 border-l-4 border-secondary/40 bg-secondary/5">
      <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center text-xl flex-shrink-0">
        <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold text-secondary text-sm">{thread.otherUser?.name || 'HausFindrr Admin'}</p>
          <span className="text-xs text-secondary/60 bg-secondary/10 px-1.5 py-0.5 rounded-full">Direct Message</span>
        </div>
        <p className="text-gray-400 text-xs truncate">{thread.latestMessage?.content}</p>
      </div>
      {thread.unreadCount > 0 && (
        <span className="flex-shrink-0 bg-secondary text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
          {thread.unreadCount}
        </span>
      )}
    </div>
  );
}

function PropertyRow({ property, badge, badgeColor }) {
  const photo = property?.photos?.[0];
  return (
    <Link to={`/property/${property.id}`} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
      {photo ? (
        <img src={photo.filePath} className="w-20 h-16 object-cover rounded-lg flex-shrink-0" alt="" />
      ) : (
        <div className="w-20 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl">🏠</div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-gray-900 truncate">{property.title}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>{badge}</span>
        </div>
        <p className="text-gray-500 text-sm">📍 {property.locationGeneral}</p>
        <p className="text-primary font-bold text-sm">K{Number(property.price).toLocaleString()}</p>
      </div>
    </Link>
  );
}

function EmptyState({ icon, text, link, linkText }) {
  return (
    <div className="text-center py-16 text-gray-400">
      <div className="text-5xl mb-3">{icon}</div>
      <p className="mb-4">{text}</p>
      {link && <Link to={link} className="btn-secondary text-sm px-5 py-2">{linkText}</Link>}
    </div>
  );
}
