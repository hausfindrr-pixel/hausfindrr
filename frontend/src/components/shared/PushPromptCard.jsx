import { useState, useEffect } from 'react';
import api from '../../services/api';

const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

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

export default function PushPromptCard({ onDone, role = 'landlord' }) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Don't show if push isn't supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    // Don't show if already granted/denied
    if (Notification.permission !== 'default') return;
    // Check cooldown
    try {
      const dismissed = localStorage.getItem('hf_push_dismissed');
      if (dismissed && Date.now() - Number(dismissed) < COOLDOWN_MS) return;
    } catch { /* ignore */ }
    setVisible(true);
  }, []);

  async function handleYes() {
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
      onDone?.();
    }
  }

  async function handleDismiss() {
    try { localStorage.setItem('hf_push_dismissed', String(Date.now())); } catch { /* ignore */ }
    // Tell backend to record dismissal so we don't re-ask in settings prompt
    api.patch('/notifications/settings', { dismissPrompt: true }).catch(() => {});
    setVisible(false);
    onDone?.();
  }

  if (!visible) return null;

  return (
    <div className="mx-4 my-3 rounded-2xl border border-[#EDE0CE] bg-[#FBF7F3] p-4 flex items-start gap-3 shadow-sm">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">Stay in the loop</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
          {role === 'tenant'
            ? 'Get notified the moment a landlord replies to your message.'
            : 'Get notified when you receive a message, your ID is verified, or a listing is approved.'}
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleYes}
            disabled={loading}
            className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Enabling…' : 'Yes, notify me'}
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-1.5 text-xs font-medium text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Not now
          </button>
        </div>
        {/iphone|ipad|ipod/i.test(navigator.userAgent) && (
          <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
            On iPhone, tap <strong>Share → Add to Home Screen</strong> first to enable notifications.
          </p>
        )}
      </div>
    </div>
  );
}
