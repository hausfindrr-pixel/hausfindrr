import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/shared/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { useLoginAttempts, LoginAttemptsWarning } from '../../components/shared/LoginAttemptsWarning';
import api from '../../services/api';

export default function TenantLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
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
      const { data } = await api.post('/auth/login', { ...form, role: 'tenant' });
      saveAuth(data.token, data.user);
      navigate('/browse');
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 403 || status === 429) {
        onLoginError(err);
      } else {
        toast.error(err.response?.data?.error || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Tenant Sign In" subtitle="Find your perfect property in PNG">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" required value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" required value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
        </div>

        <LoginAttemptsWarning state={attemptState} onExpire={clearLock} />

        <button className="btn-secondary w-full mt-2" disabled={loading || isLocked}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
      <p className="text-center mt-5 text-sm text-gray-500">
        No account?{' '}
        <Link to="/tenant/register" className="text-secondary font-medium hover:underline">Register</Link>
      </p>
      <p className="text-center mt-2 text-sm text-gray-400">
        <Link to="/" className="hover:underline">← Back to home</Link>
      </p>
    </AuthLayout>
  );
}
