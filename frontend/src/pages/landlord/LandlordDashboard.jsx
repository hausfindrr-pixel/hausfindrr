import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../../components/shared/Navbar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { priceLabel } from '../../utils/format';

const STATUS_BADGE = {
  draft:    'bg-gray-100 text-gray-500 border-gray-200',
  pending:  'bg-yellow-100 text-yellow-700 border-yellow-200',
  active:   'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  rented:   'bg-blue-100 text-blue-700 border-blue-200',
};

export default function LandlordDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [deleting, setDeleting] = useState(null);
  const [togglingOccupied, setTogglingOccupied] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null); // property id with open "..." menu
  const [confirmDelete, setConfirmDelete] = useState(null); // property id awaiting confirm

  useEffect(() => {
    api.get('/properties/my')
      .then(r => setProperties(r.data.properties))
      .finally(() => setLoading(false));
    api.get('/notifications').then(r => setNotifications(r.data.notifications || [])).catch(() => {});
    api.get('/messages/inbox').then(r => setThreads(r.data.threads || [])).catch(() => {});
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

  async function handleToggleOccupied(id, currentOccupied) {
    setTogglingOccupied(id);
    // Optimistic update
    setProperties(prev => prev.map(p => p.id === id ? { ...p, occupied: !currentOccupied } : p));
    try {
      const { data } = await api.patch(`/properties/${id}/occupied`);
      // Confirm with server value
      setProperties(prev => prev.map(p => p.id === id ? { ...p, occupied: data.occupied } : p));
      toast.success(data.occupied ? 'Listing marked as occupied — hidden from browse' : 'Listing is available again');
    } catch {
      // Revert on failure
      setProperties(prev => prev.map(p => p.id === id ? { ...p, occupied: currentOccupied } : p));
      toast.error('Failed to update occupied status');
    } finally {
      setTogglingOccupied(null);
    }
  }

  async function handleMarkRented(id) {
    if (!window.confirm('Mark this property as rented? It will be hidden from search results.')) return;
    try {
      await api.patch(`/properties/${id}/rented`);
      setProperties(prev => prev.map(p => p.id === id ? { ...p, status: 'rented' } : p));
      toast.success('Property marked as rented');
    } catch {
      toast.error('Failed to mark as rented');
    }
  }

  // Unread count per listing for the "N new messages" button
  const unreadByListing = threads.reduce((acc, t) => {
    if (!t.isDirect && t.propertyId) {
      acc[t.propertyId] = (acc[t.propertyId] || 0) + (t.unreadCount || 0);
    }
    return acc;
  }, {});

  const isVerified = user?.status === 'active';
  const isPending = user?.status === 'pending_verification';
  const isRejected = user?.status === 'rejected';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage your property listings</p>
            {user?.accountCode && (
              <p className="text-xs text-primary/60 font-mono font-semibold mt-1">Account ID: {user.accountCode}</p>
            )}
          </div>
          <div>
            {isVerified ? (
              <Link to="/landlord/new-listing" className="btn-primary">
                + Add New Listing
              </Link>
            ) : (
              <div className="relative group inline-block">
                <button className="btn-primary opacity-50 cursor-not-allowed" disabled>
                  + Add New Listing
                </button>
                <div className="absolute right-0 top-full mt-1 w-56 bg-gray-800 text-white text-xs rounded-xl p-2.5 hidden group-hover:block z-10 shadow-lg">
                  Your account must be verified before you can post listings.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account status banners */}
        {isPending && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
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
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">Account verification failed</p>
              <p className="text-xs text-red-700 mt-0.5">Please contact us at info@hausfindrr.com for assistance.</p>
            </div>
          </div>
        )}

        {isVerified && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-green-700">Account verified — you can post listings</p>
          </div>
        )}

        {/* Properties grid */}
        <div className="mb-10">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              My Listings <span className="text-gray-400 font-normal text-base">({properties.length})</span>
            </h2>
            {properties.length > 0 && (() => {
              const totViews = properties.reduce((s, p) => s + (p.stats?.viewsAllTime || 0), 0);
              const totMsg   = properties.reduce((s, p) => s + (p.stats?.messageCount || 0), 0);
              return (
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {totViews.toLocaleString()} total views
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {totMsg.toLocaleString()} enquiries
                  </span>
                </div>
              );
            })()}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
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
                <Link to="/landlord/new-listing" className="btn-primary inline-block">Create First Listing</Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {properties.map(p => {
                const photo = p.photos?.[0];
                const photoUrl = photo ? photo.filePath : null;
                const isActive = p.status === 'active';
                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group flex flex-col"
                  >
                    {/* Photo */}
                    <div className="relative h-44 bg-gray-100 flex-shrink-0">
                      {photoUrl ? (
                        <img src={photoUrl} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_BADGE[p.status]}`}>
                          {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          Rent
                        </span>
                        {isActive && p.listingType === 'rent' && p.occupied && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                            Occupied
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-4 cursor-pointer flex-1" onClick={() => navigate(`/property/${p.id}`)}>
                      <p className="font-semibold text-gray-900 truncate group-hover:text-primary transition-colors text-sm">
                        {p.title}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 mb-2">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {p.locationGeneral}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-base font-bold text-gray-900">{priceLabel(p.price, p.listingType, p.rentFrequency)}</p>
                        {['house', 'apartment'].includes(p.propertyType) && p.bedrooms != null && (
                          <p className="text-xs text-gray-400">{p.bedrooms}bd · {p.bathrooms}ba</p>
                        )}
                      </div>
                      {p.rejectionReason && (
                        <div className="mt-2 p-2 bg-red-50 rounded-lg">
                          <p className="text-xs text-red-600 font-medium">Rejected: {p.rejectionReason}</p>
                        </div>
                      )}
                    </div>

                    {/* Stats row */}
                    <ListingStats stats={p.stats} propertyId={p.id} />

                    {/* Card footer actions */}
                    <div className="px-4 pb-4 space-y-2">
                      {/* Top row: unread messages pill + "..." menu */}
                      <div className="flex items-center gap-2">
                        {unreadByListing[p.id] > 0 && (
                          <button
                            onClick={() => navigate(`/landlord/messages?listing=${p.id}`)}
                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#975536] bg-[#EDE0CE] hover:bg-[#ddd0bc] rounded-lg py-2 transition-colors"
                            style={{ minHeight: 36 }}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {unreadByListing[p.id]} new message{unreadByListing[p.id] !== 1 ? 's' : ''}
                          </button>
                        )}
                        {/* "..." kebab for delete */}
                        <div className="relative ml-auto">
                          <button
                            onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="More options"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
                            </svg>
                          </button>
                          {menuOpen === p.id && (
                            <div className="absolute right-0 bottom-full mb-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1 min-w-[140px]">
                              <button
                                onClick={() => { setConfirmDelete(p.id); setMenuOpen(null); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                              >
                                Delete listing
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Confirm delete inline */}
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

                      {/* Mark as Rented — active listings */}
                      {isActive && (
                        <button
                          onClick={() => handleMarkRented(p.id)}
                          className="w-full text-xs font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-50 border border-blue-200 rounded-lg py-2 transition-colors"
                        >
                          Mark as Rented
                        </button>
                      )}

                      {/* Occupied toggle — rental + active only */}
                      {isActive && p.listingType === 'rent' && (
                        <button
                          onClick={() => handleToggleOccupied(p.id, p.occupied)}
                          disabled={togglingOccupied === p.id}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                            p.occupied
                              ? 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <span>{p.occupied ? 'Occupied — hidden from browse' : 'Mark as Occupied'}</span>
                          <span className={`relative inline-flex h-4 w-7 flex-shrink-0 rounded-full transition-colors ml-2 ${p.occupied ? 'bg-orange-400' : 'bg-gray-300'}`}>
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform mt-0.5 ${p.occupied ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications section */}
        {notifications.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>
            <div className="space-y-3">
              {notifications.map(n => (
                <LandlordNotificationRow key={n.id} notification={n} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Stats chip row shown on each listing card, with a popover on the eye icon
function ListingStats({ stats, propertyId }) {
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
      {/* Eye icon + count — tappable, opens breakdown */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1 hover:text-gray-600 transition-colors py-1"
          aria-label="View count"
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
      {/* Message count */}
      <span className="flex items-center gap-1">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {messageCount.toLocaleString()} {messageCount === 1 ? 'enquiry' : 'enquiries'}
      </span>
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

function LandlordNotificationRow({ notification }) {
  const diff = Date.now() - new Date(notification.createdAt).getTime();
  const m = Math.floor(diff / 60000);
  const timeAgo = m < 1 ? 'just now' : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m/60)}h ago` : `${Math.floor(m/1440)}d ago`;
  return (
    <div className="flex items-start gap-3.5 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="w-11 h-11 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <p className="font-semibold text-gray-900 text-sm">HausFindrr Support</p>
          <span className="text-xs text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded-full font-medium">Official</span>
        </div>
        <div className="bg-gray-50 rounded-xl px-3.5 py-3">
          <p className="text-xs font-semibold text-gray-700 mb-1">{notification.title}</p>
          <p className="text-gray-600 text-sm leading-relaxed">{notification.content}</p>
        </div>
        <p className="text-gray-400 text-xs mt-1.5">{timeAgo}</p>
      </div>
    </div>
  );
}

