import { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/shared/Navbar';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TABS = ['pending_landlords', 'pending_properties', 'all_landlords', 'all_listings'];
const TAB_LABELS = {
  pending_landlords: 'Pending Landlords',
  pending_properties: 'Pending Listings',
  all_landlords: 'All Landlords',
  all_listings: 'All Listings',
};

export default function AdminDashboard() {
  const [tab, setTab] = useState('pending_landlords');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const endpoints = {
        pending_landlords: '/admin/landlords/pending',
        pending_properties: '/admin/properties/pending',
        all_landlords: '/admin/landlords',
        all_listings: '/admin/properties',
      };
      const { data: d } = await api.get(endpoints[tab]);
      setData(prev => ({ ...prev, [tab]: d }));
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function verifyLandlord(id, action, r = '') {
    await api.patch(`/admin/landlords/${id}/verify`, { action, reason: r });
    toast.success(`Landlord ${action}d`);
    setRejectTarget(null);
    load();
  }

  async function reviewProperty(id, action, r = '') {
    await api.patch(`/admin/properties/${id}/review`, { action, reason: r });
    toast.success(`Listing ${action}d`);
    setRejectTarget(null);
    load();
  }

  const STATUS_BADGE = { pending_verification: 'bg-yellow-100 text-yellow-800', active: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800', pending: 'bg-yellow-100 text-yellow-800', suspended: 'bg-gray-100 text-gray-800' };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-primary mb-6">Admin Dashboard</h1>

        {/* Reject modal */}
        {rejectTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <h3 className="font-bold text-primary mb-3">Rejection Reason</h3>
              <textarea className="input h-24 resize-none mb-4" value={reason}
                onChange={e => setReason(e.target.value)} placeholder="Explain why this is being rejected…" />
              <div className="flex gap-3">
                <button className="btn-primary flex-1" onClick={() => {
                  rejectTarget.type === 'landlord'
                    ? verifyLandlord(rejectTarget.id, 'reject', reason)
                    : reviewProperty(rejectTarget.id, 'reject', reason);
                }}>Confirm Reject</button>
                <button className="btn-outline flex-1" onClick={() => setRejectTarget(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Tab nav */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 flex-wrap">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-primary'}`}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {loading ? <p className="text-gray-400">Loading…</p> : (
          <>
            {/* Pending Landlords */}
            {tab === 'pending_landlords' && (
              <div className="space-y-4">
                {(data.pending_landlords?.landlords || []).length === 0
                  ? <Empty text="No pending landlord verifications" />
                  : (data.pending_landlords?.landlords || []).map(l => (
                    <div key={l.id} className="card p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{l.name}</p>
                          <p className="text-gray-500 text-sm">{l.email} · {l.phone}</p>
                          <p className="text-gray-400 text-xs mt-0.5">{new Date(l.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => verifyLandlord(l.id, 'approve')} className="btn-primary text-sm px-4 py-1.5">Approve</button>
                          <button onClick={() => setRejectTarget({ id: l.id, type: 'landlord' })} className="bg-red-500 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-red-600">Reject</button>
                        </div>
                      </div>
                      {l.landlordDocuments?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2 uppercase">Documents</p>
                          <div className="flex flex-wrap gap-2">
                            {l.landlordDocuments.map(d => (
                              <a key={d.id}
                                href={`/uploads/documents/${d.filePath.split('/').pop()}`}
                                target="_blank" rel="noopener noreferrer"
                                className="text-xs bg-secondary/10 text-secondary px-3 py-1.5 rounded-lg hover:bg-secondary/20 flex items-center gap-1">
                                📄 {d.docType}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {/* Pending Properties */}
            {tab === 'pending_properties' && (
              <div className="space-y-4">
                {(data.pending_properties?.properties || []).length === 0
                  ? <Empty text="No pending property listings" />
                  : (data.pending_properties?.properties || []).map(p => (
                    <div key={p.id} className="card p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{p.title}</p>
                          <p className="text-gray-500 text-sm">{p.locationGeneral} · K{Number(p.price).toLocaleString()} · {p.bedrooms}bd {p.bathrooms}ba</p>
                          <p className="text-gray-400 text-xs">By {p.landlord?.name} ({p.landlord?.email})</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => reviewProperty(p.id, 'approve')} className="btn-primary text-sm px-4 py-1.5">Approve</button>
                          <button onClick={() => setRejectTarget({ id: p.id, type: 'property' })} className="bg-red-500 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-red-600">Reject</button>
                        </div>
                      </div>
                      {p.photos?.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {p.photos.map(ph => (
                            <img key={ph.id}
                              src={`/uploads/photos/${ph.filePath.split('/').pop()}`}
                              className="w-20 h-16 object-cover rounded-lg" alt="" />
                          ))}
                        </div>
                      )}
                      {p.amenities?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {p.amenities.map(a => (
                            <span key={a.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a.amenityName}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {/* All Landlords */}
            {tab === 'all_landlords' && (
              <div className="space-y-3">
                {(data.all_landlords?.landlords || []).map(l => (
                  <div key={l.id} className="card p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{l.name}</p>
                      <p className="text-gray-500 text-sm">{l.email} · {l.phone}</p>
                      <p className="text-gray-400 text-xs">{l.properties?.length || 0} listings</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[l.status] || 'bg-gray-100 text-gray-600'}`}>
                      {l.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* All Listings */}
            {tab === 'all_listings' && (
              <div className="space-y-3">
                {(data.all_listings?.properties || []).map(p => (
                  <div key={p.id} className="card p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{p.title}</p>
                      <p className="text-gray-500 text-sm">{p.locationGeneral} · K{Number(p.price).toLocaleString()}</p>
                      <p className="text-gray-400 text-xs">By {p.landlord?.name}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[p.status] || 'bg-gray-100 text-gray-600'}`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="text-center py-16 text-gray-400">
      <div className="text-4xl mb-3">✅</div>
      <p>{text}</p>
    </div>
  );
}
