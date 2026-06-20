import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/shared/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function LandlordLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { saveAuth } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { ...form, role: 'landlord' });
      saveAuth(data.token, data.user);
      navigate('/landlord/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Landlord Sign In" subtitle="Access your property dashboard">
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
        <button className="btn-primary w-full mt-2" disabled={loading}>
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
