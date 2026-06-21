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

const STATUS_BADGE = {
  pending_verification: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
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
    try {
      await api.patch(`/admin/landlords/${id}/verify`, { action, reason: r });
      toast.success(`Landlord ${action}d`);
      setRejectTarget(null);
      setReason('');
      load();
    } catch {
      toast.error('Action failed');
    }
  }

  async function reviewProperty(id, action, r = '') {
    try {
      await api.patch(`/admin/properties/${id}/review`, { action, reason: r });
      toast.success(`Listing ${action}d`);
      setRejectTarget(null);
      setReason('');
      load();
    } catch {
      toast.error('Action failed');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Review landlords and property listings</p>
        </div>

        {/* Reject modal */}
        {rejectTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="font-bold text-gray-900 mb-1">Rejection Reason</h3>
              <p className="text-sm text-gray-500 mb-4">Provide a reason so the user knows what to fix.</p>
              <textarea
                className="input h-24 resize-none mb-4 text-sm"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. ID document is blurry or unreadable. Please resubmit a clear photo…"
              />
              <div className="flex gap-3">
                <button
                  className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-semibold hover:bg-red-600 transition-colors text-sm"
                  onClick={() => {
                    rejectTarget.type === 'landlord'
                      ? verifyLandlord(rejectTarget.id, 'reject', reason)
                      : reviewProperty(rejectTarget.id, 'reject', reason);
                  }}
                >
                  Confirm Rejection
                </button>
                <button className="flex-1 btn-outline text-sm py-2.5" onClick={() => { setRejectTarget(null); setReason(''); }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab navigation */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-6 flex-wrap">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-2xl" />)}
          </div>
        ) : (
          <>
            {/* Pending Landlords */}
            {tab === 'pending_landlords' && (
              <div className="space-y-4">
                {(data.pending_landlords?.landlords || []).length === 0
                  ? <Empty text="No pending landlord verifications" />
                  : (data.pending_landlords?.landlords || []).map(l => (
                    <div key={l.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-bold text-base">{l.name?.[0]?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{l.name}</p>
                            <p className="text-gray-500 text-sm">{l.email}</p>
                            <p className="text-gray-500 text-sm">{l.phone}</p>
                            <p className="text-gray-400 text-xs mt-1">Registered {new Date(l.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => verifyLandlord(l.id, 'approve')}
                            className="bg-green-500 text-white text-sm px-4 py-2 rounded-xl hover:bg-green-600 transition-colors font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectTarget({ id: l.id, type: 'landlord' })}
                            className="bg-red-100 text-red-600 text-sm px-4 py-2 rounded-xl hover:bg-red-200 transition-colors font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      </div>

                      {/* ID Documents */}
                      {l.landlordIdDocuments?.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-50">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">ID Documents</p>
                          <div className="flex flex-wrap gap-2">
                            {l.landlordIdDocuments.map(d => (
                              <a
                                key={d.id}
                                href={d.filePath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs bg-secondary/10 text-secondary px-3 py-1.5 rounded-lg hover:bg-secondary/20 transition-colors font-medium"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {d.docType.replace('_', ' ')} document
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
                    <div key={p.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.listingType === 'rent' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                              {p.listingType === 'rent' ? 'For Rent' : 'For Sale'}
                            </span>
                            <span className="text-xs text-gray-400 capitalize">{p.propertyType}</span>
                          </div>
                          <p className="font-semibold text-gray-900">{p.title}</p>
                          <p className="text-gray-500 text-sm mt-0.5">{p.locationGeneral} · K{Number(p.price).toLocaleString()} · {p.bedrooms}bd {p.bathrooms}ba</p>
                          <p className="text-gray-400 text-xs mt-1">By {p.landlord?.name} ({p.landlord?.email})</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => reviewProperty(p.id, 'approve')}
                            className="bg-green-500 text-white text-sm px-4 py-2 rounded-xl hover:bg-green-600 transition-colors font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectTarget({ id: p.id, type: 'property' })}
                            className="bg-red-100 text-red-600 text-sm px-4 py-2 rounded-xl hover:bg-red-200 transition-colors font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      </div>

                      {/* Photos */}
                      {p.photos?.length > 0 && (
                        <div className="flex gap-2 flex-wrap mb-3">
                          {p.photos.map(ph => (
                            <img
                              key={ph.id}
                              src={ph.filePath}
                              className="w-20 h-16 object-cover rounded-xl border border-gray-100"
                              alt=""
                            />
                          ))}
                        </div>
                      )}

                      {/* Title documents */}
                      {p.titleDocuments?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Ownership Documents</p>
                          <div className="flex flex-wrap gap-2">
                            {p.titleDocuments.map(d => (
                              <a
                                key={d.id}
                                href={d.filePath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs bg-secondary/10 text-secondary px-3 py-1.5 rounded-lg hover:bg-secondary/20 transition-colors font-medium"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {d.docType} doc
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Amenities */}
                      {p.amenities?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {p.amenities.map(a => (
                            <span key={a.id} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{a.amenityName}</span>
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
                {(data.all_landlords?.landlords || []).length === 0
                  ? <Empty text="No landlords yet" />
                  : (data.all_landlords?.landlords || []).map(l => (
                    <div key={l.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-bold text-sm">{l.name?.[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{l.name}</p>
                          <p className="text-gray-500 text-xs">{l.email} · {l.phone}</p>
                          <p className="text-gray-400 text-xs mt-0.5">{l.properties?.length || 0} listings</p>
                        </div>
                      </div>
                      <span className={`badge ${STATUS_BADGE[l.status] || 'bg-gray-100 text-gray-600'} flex-shrink-0`}>
                        {l.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            {/* All Listings */}
            {tab === 'all_listings' && (
              <div className="space-y-3">
                {(data.all_listings?.properties || []).length === 0
                  ? <Empty text="No listings yet" />
                  : (data.all_listings?.properties || []).map(p => (
                    <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {p.photos?.[0] && (
                          <img
                            src={p.photos[0].filePath}
                            className="w-12 h-10 object-cover rounded-xl flex-shrink-0"
                            alt=""
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{p.title}</p>
                          <p className="text-gray-500 text-xs">{p.locationGeneral} · K{Number(p.price).toLocaleString()}</p>
                          <p className="text-gray-400 text-xs">By {p.landlord?.name}</p>
                        </div>
                      </div>
                      <span className={`badge ${STATUS_BADGE[p.status] || 'bg-gray-100 text-gray-600'} flex-shrink-0`}>
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
    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
      <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-gray-400 font-medium">{text}</p>
    </div>
  );
}
