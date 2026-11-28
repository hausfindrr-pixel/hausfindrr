import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Footer from '../../components/shared/Footer';

function normalisePngPhone(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let s = raw.replace(/[\s\-().]/g, '');
  if (/[a-zA-Z]/.test(s)) return null;
  if (s.startsWith('+675')) s = s.slice(4);
  else if (s.startsWith('675')) s = s.slice(3);
  if (!/^\d{8}$/.test(s)) return null;
  return '+675' + s;
}

const TRUST_LINES = [
  'Free to list',
  'No agents',
  'Tenants message you inside HausFindrr',
  'Your ID is private and never shown to tenants',
];

export default function LandlordRegister() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { saveAuth } = useAuth();
  const navigate = useNavigate();

  const utmCampaign = searchParams.get('utm_campaign') || null;

  useEffect(() => {
    const c = utmCampaign || sessionStorage.getItem('hf_campaign') || null;
    if (utmCampaign) sessionStorage.setItem('hf_campaign', utmCampaign);
    api.post('/funnel/event', { event: 'page_opened', campaign: c }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!agreed) return toast.error('Please accept the agreement to continue');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    const phone = normalisePngPhone(form.phone);
    if (!phone) return toast.error('Please enter a valid PNG mobile number (e.g. 70000000)');
    setLoading(true);
    try {
      const campaign = utmCampaign || sessionStorage.getItem('hf_campaign') || null;
      const { data } = await api.post('/auth/register/landlord', {
        name: form.name,
        email: form.email,
        phone,
        password: form.password,
        campaign,
      });
      saveAuth(data.token, data.user);
      navigate('/landlord/new-listing');
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 shadow-sm px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <Link to="/" className="text-2xl font-bold text-primary">HausFindrr</Link>
        </div>
      </header>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">

          {/* Trust lines */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-6 pb-5 border-b border-gray-100">
            {TRUST_LINES.map(line => (
              <span key={line} className="flex items-center gap-1 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {line}
              </span>
            ))}
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-primary mb-1">List your property</h1>
            <p className="text-gray-500 text-sm">Create your free landlord account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                className="input"
                required
                placeholder="Your full name"
                value={form.name}
                onChange={set('name')}
              />
            </div>

            <div>
              <label className="label">Email Address</label>
              <input
                className="input"
                type="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
              />
            </div>

            <div>
              <label className="label">Phone Number</label>
              <input
                className="input"
                type="tel"
                required
                placeholder="70000000"
                value={form.phone}
                onChange={set('phone')}
              />
              <p className="text-xs text-gray-400 mt-1">PNG mobile number, e.g. 70000000 or +675 70000000</p>
            </div>

            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                required
                minLength={8}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={set('password')}
              />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0"
              />
              <span className="text-sm text-gray-700">
                I agree to the{' '}
                <Link to="/landlord-agreement" target="_blank" rel="noopener noreferrer" className="text-secondary font-medium hover:underline">
                  Landlord Agreement
                </Link>
                ,{' '}
                <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-secondary font-medium hover:underline">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-secondary font-medium hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>

            <button
              className="btn-primary w-full py-3 text-base mt-2"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Create Account & Add Listing →'}
            </button>
          </form>

          <p className="text-center mt-5 text-sm text-gray-500">
            Already registered?{' '}
            <Link to="/landlord/login" className="text-secondary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
