import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../../components/shared/Navbar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import MessageThread from '../../components/tenant/MessageThread';
import { priceLabel } from '../../utils/format';

const STATUS_BADGE = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  active: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
};

const LISTING_TYPE_BADGE = {
  rent: 'bg-primary/10 text-primary',
  sale: 'bg-secondary/10 text-secondary',
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
  const [markingSold, setMarkingSold] = useState(null);
  const [openThread, setOpenThread] = useState(null);
  const [expandedProperty, setExpandedProperty] = useState(null);

  useEffect(() => {
    api.get('/properties/my')
      .then(r => setProperties(r.data.properties))
      .finally(() => setLoading(false));
    api.get('/notifications').then(r => setNotifications(r.data.notifications || [])).catch(() => {});
  }, []);

  const loadThreads = useCallback(() => {
    api.get('/messages/inbox').then(r => setThreads(r.data.threads || [])).catch(() => {});
  }, []);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  async function handleDelete(id) {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    setDeleting(id);
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

  async function handleMarkSold(id) {
    if (!window.confirm('Mark this listing as sold? It will be permanently removed from your dashboard.')) return;
    setMarkingSold(id);
    try {
      await api.patch(`/properties/${id}/sold`);
      setProperties(prev => prev.filter(p => p.id !== id));
      toast.success('Listing marked as sold and removed');
    } catch {
      toast.error('Failed to mark as sold');
    } finally {
      setMarkingSold(null);
    }
  }

  function handleThreadOpen(thread) {
    const isAlreadyOpen = openThread?.propertyId === thread.propertyId && openThread?.otherUserId === thread.otherUser.id;
    if (isAlreadyOpen) {
      setOpenThread(null);
    } else {
      setOpenThread({ propertyId: thread.propertyId, otherUserId: thread.otherUser.id, otherName: thread.otherUser.name });
    }
  }

  function handleRead() {
    loadThreads();
  }

  // Group threads by property
  const threadsByProperty = threads.reduce((acc, t) => {
    const pid = t.propertyId;
    if (!acc[pid]) acc[pid] = { property: t.property, threads: [] };
    acc[pid].threads.push(t);
    return acc;
  }, {});

  const totalUnread = threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0);

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
              <p className="text-xs text-red-700 mt-0.5">Please contact support at support@hausfindrr.com for assistance.</p>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            My Listings <span className="text-gray-400 font-normal text-base">({properties.length})</span>
          </h2>

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
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LISTING_TYPE_BADGE[p.listingType]}`}>
                          {p.listingType === 'rent' ? 'Rent' : 'Sale'}
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
                        <p className="text-xs text-gray-400">{p.bedrooms}bd · {p.bathrooms}ba</p>
                      </div>
                      {p.rejectionReason && (
                        <div className="mt-2 p-2 bg-red-50 rounded-lg">
                          <p className="text-xs text-red-600 font-medium">Rejected: {p.rejectionReason}</p>
                        </div>
                      )}
                    </div>

                    {/* Card footer actions */}
                    <div className="px-4 pb-4 space-y-2">
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
                          {/* Toggle pill */}
                          <span className={`relative inline-flex h-4 w-7 flex-shrink-0 rounded-full transition-colors ml-2 ${p.occupied ? 'bg-orange-400' : 'bg-gray-300'}`}>
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform mt-0.5 ${p.occupied ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                          </span>
                        </button>
                      )}

                      {/* Mark as Sold — sale + active only */}
                      {isActive && p.listingType === 'sale' && (
                        <button
                          onClick={() => handleMarkSold(p.id)}
                          disabled={markingSold === p.id}
                          className="w-full text-xs font-medium text-secondary hover:text-secondary/80 hover:bg-secondary/5 border border-secondary/20 rounded-lg py-2 transition-colors"
                        >
                          {markingSold === p.id ? 'Processing…' : 'Mark as Sold'}
                        </button>
                      )}

                      {/* Delete listing */}
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        className="w-full text-xs text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-100 rounded-lg py-1.5 transition-colors"
                      >
                        {deleting === p.id ? 'Deleting…' : 'Delete listing'}
                      </button>
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

        {/* Messages section */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            {totalUnread > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {totalUnread} new
              </span>
            )}
          </div>

          {threads.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-400 font-medium text-sm">No messages yet</p>
              <p className="text-gray-300 text-xs mt-1">Tenant inquiries will appear here once they unlock your listings</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(threadsByProperty).map(([propertyId, group]) => {
                const propertyUnread = group.threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
                const isExpanded = expandedProperty === propertyId;

                return (
                  <div key={propertyId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Property header */}
                    <button
                      onClick={() => setExpandedProperty(isExpanded ? null : propertyId)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{group.property?.title || 'Property'}</p>
                          <p className="text-xs text-gray-400">{group.threads.length} conversation{group.threads.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        {propertyUnread > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                            {propertyUnread}
                          </span>
                        )}
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Thread list */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {group.threads.map(thread => {
                          const isOpen = openThread?.propertyId === thread.propertyId && openThread?.otherUserId === thread.otherUser.id;
                          const hasUnread = thread.unreadCount > 0;
                          const latest = thread.latestMessage;

                          return (
                            <div key={thread.otherUser.id}>
                              <button
                                onClick={() => handleThreadOpen(thread)}
                                className={`w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left ${isOpen ? 'bg-primary/5' : ''}`}
                              >
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${hasUnread ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-500'}`}>
                                  <span className="text-sm font-semibold">{(thread.otherUser.name || 'T')[0].toUpperCase()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className={`text-sm truncate ${hasUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                      {thread.otherUser.name}
                                    </p>
                                    {hasUnread && (
                                      <span className="bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0">
                                        {thread.unreadCount}
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                                    {latest?.content || 'No messages yet'}
                                  </p>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                  {latest?.sentAt && (
                                    <p className="text-xs text-gray-300">{formatRelativeTime(latest.sentAt)}</p>
                                  )}
                                  <svg className={`w-3.5 h-3.5 text-gray-300 mt-1 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </button>

                              {isOpen && (
                                <div className="border-t border-gray-100">
                                  <MessageThread
                                    propertyId={thread.propertyId}
                                    otherUserId={thread.otherUser.id}
                                    otherName={thread.otherUser.name}
                                    onRead={handleRead}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const NOTIFICATION_ICONS = { welcome: '👋', privacy_policy: '🔒', terms: '📋' };

function LandlordNotificationRow({ notification }) {
  const diff = Date.now() - new Date(notification.createdAt).getTime();
  const m = Math.floor(diff / 60000);
  const timeAgo = m < 1 ? 'just now' : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m/60)}h ago` : `${Math.floor(m/1440)}d ago`;
  return (
    <div className="bg-white rounded-2xl border-l-4 border-blue-300 border border-blue-100 shadow-sm p-4 flex items-start gap-4">
      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">
        {NOTIFICATION_ICONS[notification.type] || '📩'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold text-blue-800 text-sm">{notification.title}</p>
          <span className="text-xs text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded-full">HausFindrr</span>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">{notification.content}</p>
        <p className="text-gray-400 text-xs mt-1">{timeAgo}</p>
      </div>
    </div>
  );
}

function formatRelativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
