import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { priceLabel } from '../../utils/format';
import FeedbackCard from '../../components/shared/FeedbackCard';
import { shouldShowFeedback, markFeedbackShown } from '../../utils/feedbackState';

const STATUS_BADGE = {
  draft:    { cls: 'bg-gray-100 text-gray-500 border-gray-200',    label: 'Draft' },
  pending:  { cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Pending' },
  active:   { cls: 'bg-green-100 text-green-700 border-green-200',  label: 'Live' },
  rejected: { cls: 'bg-red-100 text-red-700 border-red-200',        label: 'Declined' },
  rented:   { cls: 'bg-blue-100 text-blue-700 border-blue-200',     label: 'Rented' },
};

export default function LandlordPropertiesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState([]);
  const [deleting, setDeleting] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showFeedbackCard, setShowFeedbackCard] = useState(false);

  useEffect(() => {
    const justPublished = sessionStorage.getItem('hf_just_published') === '1';
    if (justPublished) {
      sessionStorage.removeItem('hf_just_published');
      if (shouldShowFeedback()) {
        setShowFeedbackCard(true);
        markFeedbackShown();
      }
    }
    Promise.all([
      api.get('/properties/my'),
      api.get('/messages/inbox'),
    ]).then(([pr, mr]) => {
      setProperties(pr.data.properties || []);
      setThreads(mr.data.threads || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    setDeleting(id);
    setConfirmDelete(null);
    setMenuOpen(null);
    try {
      await api.delete(`/properties/${id}`);
      setProperties(prev => prev.filter(p => p.id !== id));
      toast.success('Listing deleted');
    } catch {
      toast.error('Failed to delete listing');
    } finally {
      setDeleting(null);
    }
  }

  async function handleMarkRented(id, rentedToUserId) {
    try {
      await api.patch(`/properties/${id}/rented`, rentedToUserId ? { rentedToUserId } : {});
      setProperties(prev => prev.map(p => p.id === id ? { ...p, status: 'rented' } : p));
      toast.success('Property marked as rented');
    } catch {
      toast.error('Failed to mark as rented');
    }
  }

  async function handleRelist(id) {
    try {
      await api.patch(`/properties/${id}/relist`);
      setProperties(prev => prev.map(p => p.id === id ? { ...p, status: 'active' } : p));
      toast.success('Listing is active again');
    } catch {
      toast.error('Failed to relist');
    }
  }

  const unreadByListing = threads.reduce((acc, t) => {
    if (!t.isDirect && t.propertyId) {
      acc[t.propertyId] = (acc[t.propertyId] || 0) + (t.unreadCount || 0);
    }
    return acc;
  }, {});

  const isVerified = user?.status === 'active';
  const isPending  = user?.status === 'pending_verification';
  const isRejected = user?.status === 'rejected';

  return (
    <div className="min-h-dvh bg-[#F5F0EB]" onClick={() => { setMenuOpen(null); }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#41271B]">Properties</h1>
            {!loading && properties.length > 0 && (
              <span className="text-sm text-gray-400 font-normal">({properties.length})</span>
            )}
          </div>
          {isVerified ? (
            <Link
              to="/landlord/new-listing"
              className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[#975536] hover:bg-[#41271B] px-4 py-2 rounded-xl transition-colors"
              style={{ minHeight: 40 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add Listing
            </Link>
          ) : (
            <span className="text-xs text-gray-400 italic">Verify to list</span>
          )}
        </div>
      </div>

      <div
        className="max-w-4xl mx-auto px-4 py-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}
      >
        {/* Account status banners */}
        {isPending && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">Your ID is under review</p>
              <p className="text-xs text-amber-700 mt-0.5">You'll be able to list properties once our team verifies your identity. This usually takes 1–2 business days.</p>
            </div>
          </div>
        )}
        {isRejected && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">We couldn't verify your ID</p>
              <p className="text-xs text-red-700 mt-0.5">Go to your Account to see the reason and upload a new document.</p>
              <Link to="/landlord/dashboard" className="inline-block mt-2 text-xs font-semibold text-red-700 underline underline-offset-2">
                Upload ID again →
              </Link>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="h-44 bg-gray-200 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <p className="text-gray-500 mb-1 font-medium">No listings yet</p>
            <p className="text-gray-400 text-sm mb-5">Add your first property to reach tenants across PNG.</p>
            {isVerified && (
              <Link to="/landlord/new-listing" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[#975536] hover:bg-[#41271B] px-5 py-3 rounded-xl transition-colors">
                Create First Listing
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map(p => {
              const { cls: badgeCls, label: badgeLabel } = STATUS_BADGE[p.status] || STATUS_BADGE.draft;
              const photoUrl = p.photos?.[0]?.filePath ?? null;
              const isActive = p.status === 'active';
              const isRented = p.status === 'rented';
              const unread = unreadByListing[p.id] || 0;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group flex flex-col"
                  onClick={e => e.stopPropagation()}
                >
                  {/* Photo */}
                  <div
                    className="relative h-44 bg-gray-100 flex-shrink-0 cursor-pointer"
                    onClick={() => navigate(`/property/${p.id}`)}
                  >
                    {photoUrl ? (
                      <img src={photoUrl} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badgeCls}`}>
                        {badgeLabel}
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div
                    className="p-4 cursor-pointer flex-1"
                    onClick={() => navigate(`/property/${p.id}`)}
                  >
                    <p className="font-semibold text-gray-900 truncate group-hover:text-primary transition-colors text-sm">
                      {p.title}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 mb-2">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {p.locationGeneral}
                    </p>
                    <p className="text-base font-bold text-gray-900">{priceLabel(p.price, p.listingType, p.rentFrequency)}</p>
                    {p.rejectionReason && (
                      <div className="mt-2 p-2 bg-red-50 rounded-lg">
                        <p className="text-xs text-red-600 font-medium">Declined: {p.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  {/* Stats row */}
                  <ListingStats
                    stats={p.stats}
                    propertyId={p.id}
                    unread={unread}
                    onMessagesClick={() => navigate(`/landlord/messages/${p.id}`)}
                  />

                  {/* Card footer actions */}
                  <div className="px-4 pb-4 space-y-2">
                    {/* Edit + "..." row */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/property/${p.id}`)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 border border-gray-200 rounded-lg py-2 transition-colors"
                        style={{ minHeight: 36 }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" />
                        </svg>
                        Edit
                      </button>
                      {/* "..." kebab */}
                      <div className="relative">
                        <button
                          onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === p.id ? null : p.id); }}
                          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          aria-label="More options"
                          style={{ minHeight: 36 }}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
                          </svg>
                        </button>
                        {menuOpen === p.id && (
                          <div className="absolute right-0 bottom-full mb-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1 min-w-[150px]">
                            <button
                              onClick={e => { e.stopPropagation(); setConfirmDelete(p.id); setMenuOpen(null); }}
                              className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                            >
                              Delete listing
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Confirm delete */}
                    {confirmDelete === p.id && (
                      <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                        <p className="text-xs text-red-700 font-medium mb-2">Delete this listing? This cannot be undone.</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={deleting === p.id}
                            className="flex-1 text-xs py-1.5 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-50"
                          >
                            {deleting === p.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Mark as Rented — active only */}
                    {isActive && (
                      <MarkRentedButton propertyId={p.id} onRented={(uid) => handleMarkRented(p.id, uid)} />
                    )}

                    {/* Relist — rented only */}
                    {isRented && (
                      <button
                        onClick={() => handleRelist(p.id)}
                        className="w-full text-xs font-medium text-green-700 hover:text-green-900 hover:bg-green-50 border border-green-200 rounded-lg py-2 transition-colors"
                        style={{ minHeight: 36 }}
                      >
                        Relist — make available again
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showFeedbackCard && (
          <div className="mt-4">
            <FeedbackCard onDismissed={() => setShowFeedbackCard(false)} />
          </div>
        )}
      </div>
    </div>
  );
}

function MarkRentedButton({ propertyId, onRented }) {
  // step: 'idle' | 'confirm' | 'who' | 'done'
  const [step, setStep] = useState('idle');
  const [saving, setSaving] = useState(false);
  const [tenants, setTenants] = useState([]);    // tenants who messaged
  const [loadingTenants, setLoadingTenants] = useState(false);

  async function doMarkRented() {
    setSaving(true);
    await onRented(null);  // mark rented with no tenant selection yet
    setSaving(false);
    // Now show the "who rented it?" step
    setLoadingTenants(true);
    try {
      const { data } = await api.get('/messages/inbox');
      const pts = (data.threads || []).filter(t => !t.isDirect && t.propertyId === propertyId);
      setTenants(pts.map(t => t.otherUser).filter(Boolean));
    } catch {
      // no tenants — that's fine
    } finally {
      setLoadingTenants(false);
    }
    setStep('who');
  }

  async function selectTenant(userId) {
    if (userId) {
      try { await api.patch(`/properties/${propertyId}/rented`, { rentedToUserId: userId }); } catch {}
    }
    setStep('done');
  }

  if (step === 'done') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl">
        <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-xs text-blue-700 font-medium">Marked as rented</span>
      </div>
    );
  }

  if (step === 'who') {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-2">
        <p className="text-xs font-semibold text-blue-800">Who rented it?</p>
        {loadingTenants ? (
          <p className="text-xs text-blue-500">Loading…</p>
        ) : (
          <div className="space-y-1">
            {tenants.map(t => (
              <button
                key={t.id}
                onClick={() => selectTenant(t.id)}
                className="w-full text-left text-xs py-2 px-3 rounded-lg bg-white hover:bg-blue-100 text-blue-800 font-medium border border-blue-100 transition-colors"
              >
                {t.name?.split(' ')[0] || 'Tenant'}
              </button>
            ))}
            <button
              onClick={() => selectTenant(null)}
              className="w-full text-left text-xs py-2 px-3 rounded-lg bg-white hover:bg-gray-100 text-gray-500 border border-gray-100 transition-colors"
            >
              Someone else / not through HausFindrr
            </button>
          </div>
        )}
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
        <p className="text-xs text-blue-700 font-medium mb-2">Mark as rented? It will be hidden from search.</p>
        <div className="flex gap-2">
          <button
            onClick={() => setStep('idle')}
            className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={doMarkRented}
            disabled={saving}
            className="flex-1 text-xs py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Confirm'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setStep('confirm')}
      className="w-full text-xs font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-50 border border-blue-200 rounded-lg py-2 transition-colors"
      style={{ minHeight: 36 }}
    >
      Mark as Rented
    </button>
  );
}

function ListingStats({ stats, propertyId, unread, onMessagesClick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function close(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (!stats) return null;
  const { viewsAllTime, views30d, messageCount } = stats;

  return (
    <div className="px-4 pb-2 flex items-center gap-3 text-xs text-gray-400">
      {/* Eye icon — tappable, opens breakdown */}
      <div className="relative" ref={ref}>
        <button
          onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
          className="flex items-center gap-1 hover:text-gray-600 transition-colors py-1"
          aria-label="View count"
          style={{ minHeight: 32 }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {viewsAllTime.toLocaleString()}
        </button>
        {open && (
          <ViewBreakdown propertyId={propertyId} viewsAllTime={viewsAllTime} views30d={views30d} onClose={() => setOpen(false)} />
        )}
      </div>

      {/* Message count — tappable if there are messages */}
      <button
        onClick={e => { e.stopPropagation(); onMessagesClick(); }}
        className={`flex items-center gap-1 py-1 transition-colors ${unread > 0 ? 'text-[#975536] font-semibold hover:text-[#41271B]' : 'hover:text-gray-600'}`}
        style={{ minHeight: 32 }}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {unread > 0 ? `${unread} new` : `${messageCount} ${messageCount === 1 ? 'enquiry' : 'enquiries'}`}
      </button>
    </div>
  );
}

function ViewBreakdown({ propertyId, viewsAllTime, views30d, onClose }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/properties/${propertyId}/stats`)
      .then(r => setData(r.data))
      .catch(() => setData({ views: { day7: '—', day30: views30d, allTime: viewsAllTime } }));
  }, [propertyId]);

  return (
    <div className="absolute left-0 bottom-full mb-2 bg-white border border-gray-100 rounded-xl shadow-lg z-30 p-4 w-64">
      <p className="text-xs font-semibold text-gray-700 mb-2">Views</p>
      {!data ? (
        <div className="space-y-1.5">
          {[1,2,3].map(i => <div key={i} className="h-3 bg-gray-100 rounded animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-1">
          <StatRow label="Last 7 days"  val={data.views?.day7} />
          <StatRow label="Last 30 days" val={data.views?.day30} />
          <StatRow label="All time"     val={data.views?.allTime} />
        </div>
      )}
      <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
        Views (each person counted once a day, approximate)
      </p>
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 p-1">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function StatRow({ label, val }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-800">{val ?? '—'}</span>
    </div>
  );
}
