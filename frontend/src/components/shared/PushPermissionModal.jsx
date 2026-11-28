import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const DELAY_MS = 3500;

const COPY = {
  landlord: {
    title: 'Stay on top of your listings',
    body: 'Get notified instantly when a tenant messages you, your ID is verified, or a listing is approved.',
  },
  tenant: {
    title: 'Never miss a reply',
    body: 'Get notified the moment a landlord replies to your message.',
  },
  default: {
    title: 'Enable Notifications',
    body: 'Get notified about messages and updates from HausFindrr.',
  },
};

async function getVapidKey() {
  try {
    const { data } = await api.get('/push/vapid-public-key');
    return data.key || null;
  } catch { return null; }
}

function urlBase64ToUint8Array(base64) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

function wasDismissed() {
  try {
    // respect both old inline-card key and new modal key
    const a = localStorage.getItem('hf_push_dismissed');
    const b = localStorage.getItem('hf_push_modal_dismissed');
    const ts = Math.max(Number(a) || 0, Number(b) || 0);
    return ts > 0 && Date.now() - ts < COOLDOWN_MS;
  } catch { return false; }
}

export default function PushPermissionModal() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const copy = COPY[user?.role] || COPY.default;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    if (!user || user.role === 'admin') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission !== 'default') return;
    if (wasDismissed()) return;

    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [user]);

  async function handleEnable() {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const vapidKey = await getVapidKey();
        if (vapidKey) {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          });
          await api.post('/notifications/push/subscribe', sub.toJSON());
        }
      }
    } catch { /* non-fatal */ } finally {
      setLoading(false);
      setVisible(false);
    }
  }

  function handleCancel() {
    try { localStorage.setItem('hf_push_modal_dismissed', String(Date.now())); } catch {}
    api.patch('/notifications/settings', { dismissPrompt: true }).catch(() => {});
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6 bg-black/50">
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl px-6 pt-6 pb-8 sm:pb-7 flex flex-col items-center text-center">

        {/* drag handle on mobile */}
        <div className="w-10 h-1 rounded-full bg-gray-200 mb-5 sm:hidden" />

        {/* icon */}
        <div className="w-20 h-20 rounded-3xl bg-[#EDE0CE] flex items-center justify-center mb-5 shadow-sm">
          <svg className="w-10 h-10 text-[#975536]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-[#41271B] mb-2 leading-snug">{copy.title}</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-5 max-w-xs">{copy.body}</p>

        {isIos && (
          <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5 text-left">
            <p className="text-xs font-semibold text-amber-800 mb-0.5">iPhone users</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Tap <strong>Share → Add to Home Screen</strong>, then open the app from your home screen and tap Enable here.
            </p>
          </div>
        )}

        <button
          onClick={handleEnable}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-[#975536] hover:bg-[#41271B] active:scale-95 text-white font-bold text-base transition-all disabled:opacity-50 mb-3 shadow-sm"
        >
          {loading ? 'Enabling…' : '🔔  Enable Notifications'}
        </button>
        <button
          onClick={handleCancel}
          className="w-full py-3 rounded-2xl text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
