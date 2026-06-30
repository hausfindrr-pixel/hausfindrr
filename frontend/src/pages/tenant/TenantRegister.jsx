import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/shared/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function TenantRegister() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { saveAuth } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
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
        <button className="btn-secondary w-full" disabled={loading}>
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
