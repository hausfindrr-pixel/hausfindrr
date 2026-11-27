import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotifications } from '../context/NotificationsContext';
import Navbar from '../components/shared/Navbar';

const TYPE_ICONS = {
  id_add_prompt:         '🪪',
  id_received:           '🔍',
  id_approved:           '✅',
  id_rejected:           '❌',
  listing_live:          '🏠',
  listing_removed:       '🚫',
  message_new:           '💬',
  saved_listing_rented:  '🔑',
  saved_listing_removed: '🗑',
  saved_listing_price:   '💰',
  welcome:               '👋',
  admin_pending_landlord:'🔔',
  admin_report:          '⚠️',
  default:               '🔔',
};

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-PG', { day: 'numeric', month: 'short' });
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { refresh, setUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch { /* non-fatal */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleTap(n) {
    if (!n.readAt) {
      await api.patch(`/notifications/${n.id}/read`).catch(() => {});
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x));
      setUnread(c => Math.max(0, c - 1));
      setUnreadCount(c => Math.max(0, c - 1));
    }
    if (n.link) navigate(n.link);
  }

  async function markAll() {
    await api.patch('/notifications/read-all').catch(() => {});
    setNotifications(prev => prev.map(x => ({ ...x, readAt: x.readAt || new Date().toISOString() })));
    setUnread(0);
    setUnreadCount(0);
    refresh();
  }

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          {unread > 0 && (
            <button
              onClick={markAll}
              className="text-sm font-medium text-primary hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>

        {loading && (
          <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🔔</div>
            <p className="text-gray-500 font-medium">No notifications yet</p>
            <p className="text-gray-400 text-sm mt-1">We'll let you know when something happens.</p>
          </div>
        )}

        {!loading && notifications.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => handleTap(n)}
                className={`w-full flex items-center gap-3 px-4 text-left transition-colors hover:bg-gray-50 active:bg-gray-100 ${
                  !n.readAt ? 'bg-[#FBF7F3]' : ''
                }`}
                style={{ minHeight: 48 }}
              >
                <span className="text-xl flex-shrink-0 leading-none" role="img">
                  {TYPE_ICONS[n.type] || TYPE_ICONS.default}
                </span>
                <div className="flex-1 min-w-0 py-3">
                  <p className={`text-sm leading-tight ${!n.readAt ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.body}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] text-gray-400 whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                  {!n.readAt && (
                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/notifications/settings')}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Notification settings
          </button>
        </div>
      </div>
    </div>
  );
}
