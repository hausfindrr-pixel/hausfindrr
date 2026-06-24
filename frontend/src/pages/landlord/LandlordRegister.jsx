import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/shared/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const ID_TYPE_OPTIONS = [
  { value: 'passport', label: 'Passport' },
  { value: 'drivers_licence', label: "Driver's Licence" },
  { value: 'nid', label: 'National ID (NID)' },
];

export default function LandlordRegister() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', id_type: 'passport' });
  const [idFile, setIdFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { saveAuth } = useAuth();
  const navigate = useNavigate();

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!idFile) return toast.error('Please upload your ID document');

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('id_document', idFile);

      const { data } = await api.post('/auth/register/landlord', fd);
      saveAuth(data.token, data.user);
      toast.success('Account created! Pending verification.');
      navigate('/landlord/dashboard');
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
    <AuthLayout title="Become a Landlord" subtitle="Create your account to list properties on HausFindrr">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input className="input" required placeholder="Your full name" value={form.name} onChange={set('name')} />
        </div>
        <div>
          <label className="label">Phone Number</label>
          <input className="input" type="tel" required placeholder="+675 xxx xxxx" value={form.phone} onChange={set('phone')} />
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-1.5">
            Your phone number will be visible to tenants after they pay to unlock your listing. Make sure it's a number you actively use.
          </p>
        </div>
        <div>
          <label className="label">Email Address</label>
          <input className="input" type="email" required placeholder="you@example.com" value={form.email} onChange={set('email')} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" required minLength={8} placeholder="Min. 8 characters" value={form.password} onChange={set('password')} />
        </div>

        <div className="pt-2 border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-800 mb-3">Identity Verification</p>

          <div className="mb-3">
            <label className="label">ID Type</label>
            <select className="input" value={form.id_type} onChange={set('id_type')}>
              {ID_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Upload {ID_TYPE_OPTIONS.find(o => o.value === form.id_type)?.label}</label>
            <div className="mt-1">
              <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${idFile ? 'border-secondary bg-secondary/5' : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}>
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setIdFile(e.target.files[0])} />
                {idFile ? (
                  <div className="text-center">
                    <svg className="w-8 h-8 text-secondary mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-secondary font-medium">{idFile.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Click to change</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <svg className="w-8 h-8 text-gray-300 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-500">Click to upload</p>
                    <p className="text-xs text-gray-400 mt-0.5">PDF, JPG, or PNG — max 10MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Your account will be reviewed within 1–2 business days. You'll be able to list properties once verified.</span>
        </div>

        <button className="btn-primary w-full py-3 text-base" disabled={loading}>
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="text-center mt-5 text-sm text-gray-500">
        Already registered?{' '}
        <Link to="/landlord/login" className="text-secondary font-medium hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
