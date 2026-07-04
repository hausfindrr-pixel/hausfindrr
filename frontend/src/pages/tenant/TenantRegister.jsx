import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/shared/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { TOS_SECTIONS, TOS_VERSION } from '../../constants/tos';

export default function TenantRegister() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const tosRef = useRef(null);
  const { saveAuth } = useAuth();
  const navigate = useNavigate();

  const handleScroll = useCallback(() => {
    const el = tosRef.current;
    if (!el || scrolledToBottom) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 50;
    if (nearBottom) setScrolledToBottom(true);
  }, [scrolledToBottom]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!agreed) {
      toast.error('You must agree to the Terms of Service to continue.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register/tenant', form);
      saveAuth(data.token, data.user);
      navigate('/');
    } catch (err) {
      if (!err.response) {
        toast.error('Cannot reach the server. Please try again shortly.');
      } else {
        toast.error(err.response.data?.error || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <AuthLayout title="Tenant Registration" subtitle="Start browsing properties in PNG">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input className="input" required value={form.name} onChange={set('name')} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" type="tel" required value={form.phone} onChange={set('phone')} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" required value={form.email} onChange={set('email')} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" required minLength={8} value={form.password} onChange={set('password')} />
        </div>

        {/* ToS scrollable box */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Please read our Terms of Service before registering
          </p>
          <div
            ref={tosRef}
            onScroll={handleScroll}
            className="rounded-xl border overflow-y-scroll"
            style={{
              height: 'clamp(280px, 35vw, 320px)',
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
              onChange={e => scrolledToBottom && setAgreed(e.target.checked)}
              disabled={!scrolledToBottom}
              className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0"
            />
            <span className="text-sm text-gray-700">
              I have read and agree to the{' '}
              <Link
                to="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary font-medium hover:underline"
                onClick={e => e.stopPropagation()}
              >
                Terms of Service
              </Link>
              .
            </span>
          </label>
        </div>

        <button
          className="btn-secondary w-full"
          disabled={loading || !scrolledToBottom || !agreed}
          style={(!scrolledToBottom || !agreed) ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
      <p className="text-center mt-5 text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/tenant/login" className="text-secondary font-medium hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
