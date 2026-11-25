const DISMISS_KEY = 'hf_feedback_dismissed_at';
const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// In-memory flag — resets on page reload (new session)
let _shownThisSession = false;

export function shouldShowFeedback() {
  if (_shownThisSession) return false;
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (ts && Date.now() - Number(ts) < COOLDOWN_MS) return false;
  } catch {
    // localStorage blocked (private mode) — allow showing
  }
  return true;
}

export function markFeedbackShown() {
  _shownThisSession = true;
}

export function dismissFeedback() {
  _shownThisSession = true;
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {}
}
