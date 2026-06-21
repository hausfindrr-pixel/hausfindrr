import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../../components/shared/Navbar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

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
  const [conversations, setConversations] = useState({});
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    api.get('/properties/my')
      .then(r => setProperties(r.data.properties))
      .finally(() => setLoading(false));
  }, []);

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

  // Load conversations grouped by property using the inbox endpoint
  useEffect(() => {
    api.get('/messages/inbox').then(r => {
      const grouped = {};
      for (const thread of (r.data.threads || [])) {
        const pid = thread.propertyId;
        if (!grouped[pid]) grouped[pid] = [];
        grouped[pid].push({
          propertyId: pid,
          otherUserId: thread.otherUser?.id,
          otherName: thread.otherUser?.name,
          lastMessage: thread.latestMessage?.content,
          lastSentAt: thread.latestMessage?.sentAt,
        });
      }
      setConversations(grouped);
    }).catch(() => {});
  }, []);

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

        {/* Account status banner */}
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
                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group"
                  >
                    {/* Photo */}
                    <div className="relative h-44 bg-gray-100">
                      {photoUrl ? (
                        <img src={photoUrl} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_BADGE[p.status]}`}>
                          {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LISTING_TYPE_BADGE[p.listingType]}`}>
                          {p.listingType === 'rent' ? 'Rent' : 'Sale'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 cursor-pointer" onClick={() => navigate(`/property/${p.id}`)}>
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
                        <p className="text-base font-bold text-gray-900">K{Number(p.price).toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{p.bedrooms}bd · {p.bathrooms}ba</p>
                      </div>
                      {p.rejectionReason && (
                        <div className="mt-2 p-2 bg-red-50 rounded-lg">
                          <p className="text-xs text-red-600 font-medium">Rejected: {p.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                    <div className="px-4 pb-4">
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

        {/* Conversations section */}
        {Object.keys(conversations).length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tenant Conversations</h2>
            <div className="space-y-4">
              {properties.filter(p => conversations[p.id]).map(p => (
                <ConversationGroup key={p.id} property={p} threads={conversations[p.id]} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationGroup({ property, threads }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900 text-sm">{property.title}</p>
            <p className="text-xs text-gray-400">{threads.length} conversation{threads.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {threads.map(thread => (
            <div
              key={thread.otherUserId}
              onClick={() => navigate(`/property/${property.id}`)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-secondary text-xs font-semibold">{(thread.otherName || 'T')[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{thread.otherName}</p>
                <p className="text-xs text-gray-400 truncate">{thread.lastMessage || 'Start a conversation'}</p>
              </div>
              {thread.lastSentAt && (
                <p className="text-xs text-gray-300 flex-shrink-0">
                  {new Date(thread.lastSentAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
