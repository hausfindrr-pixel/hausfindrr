import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/shared/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const ID_TYPE_OPTIONS = [
  { value: 'passport', label: 'Passport' },
  { value: 'nid', label: 'National ID (NID)' },
];

export default function LandlordRegister() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', id_type: 'passport' });
  const [files, setFiles] = useState({ passport_nid: null, title_document: null, supporting_docs: [] });
  const [loading, setLoading] = useState(false);
  const { saveAuth } = useAuth();
  const navigate = useNavigate();

  function handleFile(field, e) {
    if (field === 'supporting_docs') {
      setFiles(p => ({ ...p, supporting_docs: Array.from(e.target.files) }));
    } else {
      setFiles(p => ({ ...p, [field]: e.target.files[0] }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!files.passport_nid) return toast.error('Please upload your Passport or NID');
    if (!files.title_document) return toast.error('Please upload your property title document');

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('passport_nid', files.passport_nid);
      fd.append('title_document', files.title_document);
      files.supporting_docs.forEach(f => fd.append('supporting_docs', f));

      const { data } = await api.post('/auth/register/landlord', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      saveAuth(data.token, data.user);
      navigate('/landlord/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Landlord Registration" subtitle="Create your account and upload verification documents">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input className="input" required value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        </div>
        <div>
          <label className="label">Phone Number</label>
          <input className="input" type="tel" required value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" required value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" required minLength={8} value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
        </div>

        <div className="border-t pt-4 mt-2">
          <p className="text-sm font-semibold text-primary mb-3">Identity Verification Documents</p>

          <div className="mb-3">
            <label className="label">ID Type</label>
            <select className="input" value={form.id_type}
              onChange={e => setForm(p => ({ ...p, id_type: e.target.value }))}>
              {ID_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="mb-3">
            <label className="label">{form.id_type === 'nid' ? 'National ID' : 'Passport'} (PDF/JPG/PNG)</label>
            <input type="file" className="input py-2" accept=".pdf,.jpg,.jpeg,.png" required
              onChange={e => handleFile('passport_nid', e)} />
          </div>

          <div className="mb-3">
            <label className="label">Property Title Document</label>
            <input type="file" className="input py-2" accept=".pdf,.jpg,.jpeg,.png" required
              onChange={e => handleFile('title_document', e)} />
          </div>

          <div>
            <label className="label">Supporting Documents (optional, multiple allowed)</label>
            <input type="file" className="input py-2" accept=".pdf,.jpg,.jpeg,.png" multiple
              onChange={e => handleFile('supporting_docs', e)} />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          Your account will be reviewed by our team before you can post listings. This usually takes 1–2 business days.
        </div>

        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Submitting…' : 'Create Account'}
        </button>
      </form>
      <p className="text-center mt-5 text-sm text-gray-500">
        Already registered?{' '}
        <Link to="/landlord/login" className="text-secondary font-medium hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
