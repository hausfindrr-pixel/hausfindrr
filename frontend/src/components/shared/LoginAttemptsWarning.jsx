import { useEffect, useState } from 'react';

// Must match backend loginLimiter `max` value
const MAX_ATTEMPTS = 10;

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useLoginAttempts() {
  const [state, setState] = useState({
    remaining: null,    // null = no failed attempt yet; number = attempts left
    lockedUntil: null,  // null = not locked; ms timestamp = locked until
  });

  function onLoginError(err) {
    const status = err.response?.status;
    const headers = err.response?.headers || {};

    if (status === 429) {
      const retryAfter = parseInt(headers['retry-after'] || '900', 10);
      setState({ remaining: 0, lockedUntil: Date.now() + retryAfter * 1000 });
    } else if (status === 401 || status === 403) {
      const rem = parseInt(
        headers['ratelimit-remaining'] ??
        headers['x-ratelimit-remaining'] ??
        '-1',
        10,
      );
      if (rem >= 0) setState({ remaining: rem, lockedUntil: null });
    }
  }

  function clearLock() {
    // Called when the lockout timer expires — resets fully so warning disappears
    setState({ remaining: null, lockedUntil: null });
  }

  return { state, onLoginError, clearLock };
}

// ─── Warning banner ───────────────────────────────────────────────────────────
export function LoginAttemptsWarning({ state, onExpire }) {
  const [secondsLeft, setSecondsLeft] = useState(null);

  useEffect(() => {
    if (!state.lockedUntil) {
      setSecondsLeft(null);
      return;
    }

    function tick() {
      const s = Math.max(0, Math.ceil((state.lockedUntil - Date.now()) / 1000));
      setSecondsLeft(s);
      if (s === 0) {
        clearInterval(id);
        onExpire?.();
      }
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state.lockedUntil]); // eslint-disable-line react-hooks/exhaustive-deps

  if (state.remaining === null) return null;

  // ── Locked out ────────────────────────────────────────────────────────────
  if (state.lockedUntil) {
    const unlocked = secondsLeft !== null && secondsLeft <= 0;
    const mins = Math.floor((secondsLeft || 0) / 60);
    const secs = (secondsLeft || 0) % 60;

    return (
      <div className="flex gap-3 items-start p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700">
        <span className="flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </span>
        <div>
          <p className="font-semibold text-sm">Account temporarily locked</p>
          <p className="text-sm mt-0.5 text-red-600">
            {unlocked
              ? 'You can try again now.'
              : <>Too many failed attempts. Try again in{' '}
                  <span className="font-mono font-bold">
                    {mins}:{String(secs).padStart(2, '0')}
                  </span>
                </>
            }
          </p>
        </div>
      </div>
    );
  }

  // ── Last attempt warning (remaining = 0, not yet 429) ────────────────────
  if (state.remaining === 0) {
    return (
      <div className="flex gap-3 items-start p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700">
        <span className="flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </span>
        <div>
          <p className="font-semibold text-sm">Incorrect credentials — last attempt</p>
          <p className="text-sm mt-0.5 text-red-600">
            One more failed attempt will lock your account for 15 minutes.
          </p>
        </div>
      </div>
    );
  }

  // ── Normal warning (remaining ≥ 1) ────────────────────────────────────────
  const isClose = state.remaining <= 3;
  return (
    <div className={`flex gap-3 items-start p-3.5 rounded-xl border text-sm ${
      isClose
        ? 'bg-orange-50 border-orange-200 text-orange-800'
        : 'bg-amber-50 border-amber-200 text-amber-800'
    }`}>
      <span className="flex-shrink-0 mt-0.5">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </span>
      <div>
        <p className="font-semibold">Incorrect credentials</p>
        <p className={`mt-0.5 ${isClose ? 'text-orange-700' : 'text-amber-700'}`}>
          {state.remaining} attempt{state.remaining !== 1 ? 's' : ''} remaining before
          your account is temporarily locked.
        </p>
      </div>
    </div>
  );
}
