import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (sessionStorage.getItem('pwa-dismissed')) return;
    } catch {}

    // Already installed — don't show
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // iOS detection
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    if (ios) {
      setIsIos(true);
      setVisible(true);
      return;
    }

    // Android / Chrome — listen for beforeinstallprompt
    const handler = e => {
      e.preventDefault();
      setPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    try { sessionStorage.setItem('pwa-dismissed', '1'); } catch {}
    setVisible(false);
    setDismissed(true);
  };

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setVisible(false);
    setPrompt(null);
  };

  if (!visible || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-[#41271B] text-white rounded-2xl shadow-xl px-4 py-3.5 flex items-center gap-3 max-w-md mx-auto">
      <img src="/icon-192.png" alt="HausFindrr" className="w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Install HausFindrr</p>
        {isIos ? (
          <p className="text-xs text-white/70 mt-0.5">
            Tap <span className="font-bold">Share</span> then <span className="font-bold">Add to Home Screen</span>
          </p>
        ) : (
          <p className="text-xs text-white/70 mt-0.5">Add to your home screen for quick access</p>
        )}
      </div>
      {isIos ? (
        <button onClick={dismiss} className="text-white/60 hover:text-white p-1 flex-shrink-0" aria-label="Dismiss">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ) : (
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={dismiss} className="text-xs text-white/60 hover:text-white px-2 py-1">Later</button>
          <button onClick={install} className="text-xs bg-[#975536] hover:bg-[#7a4229] text-white font-semibold px-3 py-1.5 rounded-lg transition-colors">
            Install
          </button>
        </div>
      )}
    </div>
  );
}
