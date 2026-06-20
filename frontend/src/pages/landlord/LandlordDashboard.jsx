import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/shared/Navbar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const STATUS_BADGE = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const ACCOUNT_STATUS_MSG = {
  pending_verification: {
    color: 'bg-amber-50 border-amber-300 text-amber-800',
    msg: 'Your identity documents are under review. You can prepare listings but they won\'t go live until your account is verified.',
  },
  active: { color: 'bg-green-50 border-green-300 text-green-800', msg: 'Account verified. Your listings will be reviewed when submitted.' },
  rejected: { color: 'bg-red-50 border-red-300 text-red-800', msg: 'Account verification failed. Please contact support.' },
};

export default function LandlordDashboard() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/properties/my').then(r => setProperties(r.data.properties)).finally(() => setLoading(false));
  }, []);

  const statusInfo = ACCOUNT_STATUS_MSG[user?.status] || ACCOUNT_STATUS_MSG.pending_verification;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">Welcome, {user?.name}</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage your property listings</p>
          </div>
          {user?.status === 'active' && (
            <Link to="/landlord/new-listing" className="btn-primary">+ New Listing</Link>
          )}
        </div>

        <div className={`border rounded-xl p-4 mb-8 text-sm font-medium ${statusInfo.color}`}>
          {statusInfo.msg}
        </div>

        <h2 className="text-lg font-semibold text-primary mb-4">My Listings ({properties.length})</h2>

        {loading ? (
          <p className="text-gray-400">Loading…</p>
        ) : properties.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <div className="text-4xl mb-3">🏘️</div>
            <p>No listings yet.</p>
            {user?.status === 'active' && (
              <Link to="/landlord/new-listing" className="inline-block mt-4 btn-primary">Create First Listing</Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {properties.map(p => (
              <div key={p.id} className="card p-5 flex items-start gap-4">
                {p.photos?.[0] && (
                  <img src={`/uploads/photos/${p.photos[0].filePath.split('/').pop()}`}
                    className="w-24 h-20 object-cover rounded-lg flex-shrink-0" alt="" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{p.title}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[p.status]}`}>
                      {p.status}
                    </span>
                    <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full capitalize">
                      {p.listingType}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm">{p.locationGeneral}</p>
                  <p className="text-primary font-bold mt-1">K{Number(p.price).toLocaleString()}</p>
                  {p.rejectionReason && (
                    <p className="text-red-600 text-xs mt-1">Reason: {p.rejectionReason}</p>
                  )}
                </div>
                <div className="text-right text-sm text-gray-400">
                  {p.bedrooms}bd · {p.bathrooms}ba
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
