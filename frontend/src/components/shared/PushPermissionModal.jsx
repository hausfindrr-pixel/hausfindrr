import { useState, useEffect } from 'react';
import api from '../../services/api';

const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const DELAY_MS = 3000; // show 3 seconds after mount

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

export default function PushPermissionModal() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Must support push
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    // Already granted or denied
    if (Notification.permission !== 'default') return;
    // Check cooldown
    try {
      const dismissed = localStorage.getItem('hf_push_modal_dismissed');
      if (dismissed && Date.now() - Number(dismissed) < COOLDOWN_MS) return;
    } catch {}

    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

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
    } catch {}
    finally {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 flex flex-col items-center text-center animate-fade-in">
        {/* Bell icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#EDE0CE] flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-[#975536]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>

        <h2 className="text-lg font-bold text-[#41271B] mb-2">Enable Notifications</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          Get notified when you receive a message, your account is approved, or a listing goes live.
        </p>

        {/iphone|ipad|ipod/i.test(navigator.userAgent) && (
          <p className="text-xs text-gray-400 leading-relaxed mb-4 bg-gray-50 rounded-xl px-4 py-3">
            On iPhone, add HausFindrr to your <strong>Home Screen</strong> first (Share → Add to Home Screen), then enable notifications.
          </p>
        )}

        <button
          onClick={handleEnable}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-[#975536] hover:bg-[#41271B] text-white font-semibold text-sm transition-colors disabled:opacity-50 mb-3"
        >
          {loading ? 'Enabling…' : 'Enable Notifications'}
        </button>
        <button
          onClick={handleCancel}
          className="w-full py-3 rounded-2xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
