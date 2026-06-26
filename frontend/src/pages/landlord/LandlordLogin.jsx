import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/shared/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { useLoginAttempts, LoginAttemptsWarning } from '../../components/shared/LoginAttemptsWarning';
import api from '../../services/api';

const REMEMBERED_EMAIL_KEY = 'hf_remembered_email_landlord';

export default function LandlordLogin() {
  const [form, setForm] = useState({
    email: localStorage.getItem(REMEMBERED_EMAIL_KEY) || '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(
    Boolean(localStorage.getItem(REMEMBERED_EMAIL_KEY)),
  );
  const [loading, setLoading] = useState(false);
  const { saveAuth } = useAuth();
  const navigate = useNavigate();
  const { state: attemptState, onLoginError, clearLock } = useLoginAttempts();

  const isLocked = Boolean(attemptState.lockedUntil);

  async function handleSubmit(e) {
    e.preventDefault();
    if (isLocked) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', {
        ...form,
        role: 'landlord',
        rememberMe,
      });

      if (rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, form.email);
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }

      saveAuth(data.token, data.user, rememberMe);
      navigate('/landlord/dashboard');
    } catch (err) {
      const status = err.response?.status;
      setForm(p => ({ ...p, password: '' }));
      if (status === 401 || status === 403) {
        toast.error('Incorrect email or password. Please try again.');
        onLoginError(err);
      } else if (status === 429) {
        onLoginError(err);
      } else {
        toast.error(err.response?.data?.error || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Landlord Sign In" subtitle="Access your property dashboard">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            required
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            required
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
          />
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={e => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-[#975536]"
          />
          <span className="text-sm text-gray-600">Remember me</span>
        </label>

        <LoginAttemptsWarning state={attemptState} onExpire={clearLock} />

        <button className="btn-primary w-full mt-2" disabled={loading || isLocked}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
      <p className="text-center mt-5 text-sm text-gray-500">
        No account?{' '}
        <Link to="/landlord/register" className="text-secondary font-medium hover:underline">
          Register as Landlord
        </Link>
      </p>
      <p className="text-center mt-2 text-sm text-gray-400">
        <Link to="/" className="hover:underline">← Back to home</Link>
      </p>
    </AuthLayout>
  );
}
