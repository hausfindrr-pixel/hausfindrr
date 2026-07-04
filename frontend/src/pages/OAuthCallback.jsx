import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { TOS_SECTIONS, TOS_VERSION } from '../constants/tos';

const ERROR_MESSAGES = {
  access_denied:    'You cancelled the Google sign-in. Please try again.',
  suspended:        'Your account has been suspended. Contact support@hausfindrr.com.',
  invalid_state:    'The sign-in session expired. Please try again.',
  auth_failed:      'Google sign-in failed. Please try again or use email/password.',
  not_configured:   'Google sign-in is not configured yet. Please try again later.',
  no_email:         'Your Google account does not have a verified email address.',
};

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const { saveAuth } = useAuth();
  const navigate = useNavigate();

  const status    = params.get('status');   // 'login' | 'signup' | null
  const token     = params.get('token');
  const error     = params.get('error');
  const googleName = decodeURIComponent(params.get('name') || '');

  // Signup form state
  const [selectedRole, setSelectedRole]       = useState(null);
  const [phone, setPhone]                     = useState('');
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [agreed, setAgreed]                   = useState(false);
  const [loading, setLoading]                 = useState(false);
  const tosRef = useRef(null);

  const handleTosScroll = useCallback(() => {
    const el = tosRef.current;
    if (!el || scrolledToBottom) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) setScrolledToBottom(true);
  }, [scrolledToBottom]);

  const [authError, setAuthError] = useState(null);

  // Confirm the component mounted — visible in DevTools console
  console.log('[OAuthCallback] mounted — status:', status, 'hasToken:', !!token, 'error:', error);

  // Handle login redirect — runs once on mount
  useEffect(() => {
    if (status !== 'login' || !token) return;
    console.log('[OAuthCallback] starting login, token length:', token.length);
    (async () => {
      try {
        // Store token first so the api interceptor can attach it to /auth/me
        sessionStorage.setItem('hf_token', token);
        const { data } = await api.get('/auth/me');
        console.log('[OAuthCallback] /auth/me succeeded, user:', data.user?.email, 'role:', data.user?.role);
        saveAuth(token, data.user, false);
        toast.success(`Welcome back${data.user?.name ? `, ${data.user.name.split(' ')[0]}` : ''}!`);
        navigate(data.user.role === 'landlord' ? '/landlord/dashboard' : '/', { replace: true });
      } catch (err) {
        const code = err.response?.status;
        const msg = err.response?.data?.error || err.message || 'Unknown error';
        console.error('[OAuthCallback] /auth/me failed:', code, msg);
        sessionStorage.removeItem('hf_token');
        setAuthError(`Sign-in failed (${code || 'network error'}): ${msg}`);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleComplete(e) {
    e.preventDefault();
    if (!agreed) { toast.error('You must agree to the Terms of Service to continue.'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/google/complete', {
        tempToken: token,
        role: selectedRole,
        phone,
        agreedToTerms: true,
      });
      saveAuth(data.token, data.user, false);
      toast.success('Account created! Welcome to HausFindrr.');
      navigate(selectedRole === 'landlord' ? '/landlord/dashboard' : '/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Error screen ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-sm border border-gray-100 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="font-bold text-gray-900 mb-2">Sign-in Problem</h2>
          <p className="text-sm text-gray-500 mb-6">
            {ERROR_MESSAGES[error] || 'Something went wrong. Please try again.'}
          </p>
          <button onClick={() => navigate(-1)} className="btn-secondary w-full">Go Back</button>
        </div>
      </div>
    );
  }

  // ── Login redirect: waiting for useEffect ─────────────────────────────────
  if (status === 'login') {
    if (authError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-sm border border-gray-100 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="font-bold text-gray-900 mb-2">Sign-in Failed</h2>
            <p className="text-xs text-gray-500 mb-4 font-mono break-all">{authError}</p>
            <button onClick={() => navigate('/', { replace: true })} className="btn-secondary w-full">
              Back to Home
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Signing you in…</p>
      </div>
    );
  }

  // ── Signup flow ───────────────────────────────────────────────────────────
  if (status !== 'signup') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    );
  }

  const firstName = googleName ? googleName.split(' ')[0] : '';
  const canSubmit = selectedRole && phone.trim() && scrolledToBottom && agreed && !loading;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">

        {/* Header */}
        <div className="text-center px-6 pt-8 pb-5 border-b border-gray-50">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#41271b' }}>
            <span className="text-white text-xl font-bold">H</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Almost there{firstName ? `, ${firstName}` : ''}!
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Your Google account is connected. Fill in a couple more details to finish.
          </p>
        </div>

        <form onSubmit={handleComplete} className="px-6 py-6 space-y-6">

          {/* Role selection */}
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-3">I am registering as a…</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { role: 'tenant',   label: 'Tenant',   desc: 'Looking for a property',  icon: '🔍' },
                { role: 'landlord', label: 'Landlord', desc: 'Listing my property',      icon: '🏠' },
              ].map(opt => (
                <button
                  type="button"
                  key={opt.role}
                  onClick={() => setSelectedRole(opt.role)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedRole === opt.role
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1.5">{opt.icon}</div>
                  <p className="font-semibold text-sm text-gray-900">{opt.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
            {selectedRole === 'landlord' && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
                Landlord accounts require identity verification before you can list properties (1–2 business days).
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="label">Phone Number</label>
            <input
              className="input"
              type="tel"
              required
              placeholder="+675 xxx xxxx"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
            {selectedRole === 'landlord' && (
              <p className="text-xs text-gray-400 mt-1.5">
                Visible to tenants who unlock your listings. Use a number you actively monitor.
              </p>
            )}
          </div>

          {/* Scrollable ToS */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Please read our Terms of Service
            </p>
            <div
              ref={tosRef}
              onScroll={handleTosScroll}
              className="rounded-xl border overflow-y-scroll"
              style={{
                height: 'clamp(220px, 28vw, 280px)',
                borderColor: '#41271b',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
              }}
            >
              <div className="px-4 py-4 space-y-5 text-sm leading-relaxed text-gray-700">
                {TOS_SECTIONS.map((section, i) => (
                  <div key={i}>
                    <p className="font-semibold text-gray-900 mb-1.5">{section.heading}</p>
                    <p className="whitespace-pre-line">{section.body}</p>
                  </div>
                ))}
                <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                  Terms Version: {TOS_VERSION}
                </p>
              </div>
            </div>

            <p
              className="text-xs font-medium"
              style={{ color: scrolledToBottom ? '#16a34a' : '#975536' }}
            >
              {scrolledToBottom ? 'You have read the Terms ✓' : 'Scroll to the bottom to accept'}
            </p>

            <label
              className={`flex items-start gap-2.5 cursor-pointer select-none ${!scrolledToBottom ? 'opacity-40 pointer-events-none' : ''}`}
            >
              <input
                type="checkbox"
                checked={agreed}
                disabled={!scrolledToBottom}
                onChange={e => scrolledToBottom && setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0"
              />
              <span className="text-sm text-gray-700">
                I agree to the HausFindrr{' '}
                <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-secondary font-medium hover:underline" onClick={e => e.stopPropagation()}>
                  Terms of Service
                </Link>
                .
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="btn-secondary w-full py-3 text-base"
            disabled={!canSubmit}
            style={!canSubmit ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
          >
            {loading ? 'Creating account…' : 'Complete Registration'}
          </button>

          <p className="text-center text-xs text-gray-400">
            Already have an account?{' '}
            <Link to="/tenant/login" className="hover:underline" style={{ color: '#975536' }}>Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
