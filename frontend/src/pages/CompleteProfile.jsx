import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ID_TYPES = [
  { value: 'passport',        label: 'Passport' },
  { value: 'nid',             label: 'National ID (NID)' },
  { value: 'drivers_licence', label: "Driver's Licence" },
];

export default function CompleteProfile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const isLandlord = user?.role === 'landlord';

  const [phone,   setPhone]   = useState(user?.phone || '');
  const [idType,  setIdType]  = useState('passport');
  const [idFile,  setIdFile]  = useState(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = phone.trim() && (!isLandlord || idFile) && !loading;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const body = new FormData();
      body.append('phone', phone.trim());
      if (isLandlord && idFile) {
        body.append('id_document', idFile);
        body.append('id_type', idType);
      }
      await api.post('/auth/complete-profile', body);
      await refreshUser();
      toast.success('Profile saved!');
      navigate(isLandlord ? '/landlord/dashboard' : '/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">

        {/* Header */}
        <div className="text-center px-6 pt-8 pb-5 border-b border-gray-50">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: '#41271b' }}
          >
            <span className="text-white text-xl font-bold">H</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isLandlord
              ? 'Upload your government ID so our team can verify your account before you list properties.'
              : 'Add your phone number to finish setting up your account.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">

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
          </div>

          {/* ID upload — landlords only */}
          {isLandlord && (
            <>
              <div>
                <label className="label">ID Document Type</label>
                <select
                  className="input"
                  value={idType}
                  onChange={e => setIdType(e.target.value)}
                >
                  {ID_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Upload ID Document</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  required
                  onChange={e => setIdFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  JPG, PNG or PDF — max 10 MB. Stored securely; visible only to HausFindrr admins.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                <p className="text-xs text-amber-700">
                  Verification takes 1–2 business days. You'll be notified once approved and can start listing.
                </p>
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn-secondary w-full py-3 text-base"
            disabled={!canSubmit}
            style={!canSubmit ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
          >
            {loading ? 'Saving…' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
