import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/shared/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  // 2FA state
  const [step, setStep] = useState('credentials'); // 'credentials' | 'totp' | 'backup'
  const [tempToken, setTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [backupCode, setBackupCode] = useState('');

  const { saveAuth } = useAuth();
  const navigate = useNavigate();

  async function handleCredentials(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { ...form, role: 'admin' });
      if (data.requiresTwoFactor) {
        setTempToken(data.tempToken);
        setStep('totp');
      } else {
        saveAuth(data.token, data.user);
        navigate('/admin');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleTotp(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/2fa/verify', { tempToken, code: totpCode });
      saveAuth(data.token, data.user);
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid code');
      setTotpCode('');
    } finally {
      setLoading(false);
    }
  }

  async function handleBackup(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/2fa/verify', { tempToken, backupCode });
      saveAuth(data.token, data.user);
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid backup code');
      setBackupCode('');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'totp') {
    return (
      <AuthLayout title="Two-Factor Authentication" subtitle="Enter the 6-digit code from your authenticator app">
        <form onSubmit={handleTotp} className="space-y-4">
          <div>
            <label className="label">6-Digit Code</label>
            <input
              className="input text-center text-2xl tracking-widest font-mono"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              autoFocus
              value={totpCode}
              onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
            />
          </div>
          <button className="btn-primary w-full" disabled={loading || totpCode.length !== 6}>
            {loading ? 'Verifying…' : 'Verify Code'}
          </button>
          <button
            type="button"
            className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
            onClick={() => { setStep('backup'); setTotpCode(''); }}
          >
            Lost your phone? Use backup code
          </button>
          <button
            type="button"
            className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
            onClick={() => { setStep('credentials'); setTempToken(''); setTotpCode(''); }}
          >
            ← Back to login
          </button>
        </form>
      </AuthLayout>
    );
  }

  if (step === 'backup') {
    return (
      <AuthLayout title="Backup Code" subtitle="Enter your one-time backup code">
        <form onSubmit={handleBackup} className="space-y-4">
          <div>
            <label className="label">Backup Code</label>
            <input
              className="input text-center font-mono tracking-widest"
              type="text"
              required
              autoFocus
              value={backupCode}
              onChange={e => setBackupCode(e.target.value.toUpperCase())}
              placeholder="A3F92B1D4C"
            />
            <p className="text-xs text-amber-600 mt-1.5">
              The backup code is single-use and will be invalidated after this login.
            </p>
          </div>
          <button className="btn-primary w-full" disabled={loading || !backupCode.trim()}>
            {loading ? 'Verifying…' : 'Use Backup Code'}
          </button>
          <button
            type="button"
            className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
            onClick={() => { setStep('totp'); setBackupCode(''); }}
          >
            ← Back to authenticator code
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Admin Sign In" subtitle="HausFindrr Admin Panel">
      <form onSubmit={handleCredentials} className="space-y-4">
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
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Admin Sign In'}
        </button>
      </form>
    </AuthLayout>
  );
}
