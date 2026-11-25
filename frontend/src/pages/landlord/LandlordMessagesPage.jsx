import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '../../context/MessagesContext';
import api from '../../services/api';

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(date).toLocaleDateString('en-PG', { day: 'numeric', month: 'short' });
}

const STATUS_LABEL = {
  active:   { label: 'Live',     cls: 'bg-green-100 text-green-700' },
  pending:  { label: 'Pending',  cls: 'bg-yellow-100 text-yellow-700' },
  rented:   { label: 'Rented',   cls: 'bg-blue-100 text-blue-700' },
  draft:    { label: 'Draft',    cls: 'bg-gray-100 text-gray-500' },
  rejected: { label: 'Declined', cls: 'bg-red-100 text-red-700' },
};

export default function LandlordMessagesPage() {
  const { refreshUnread } = useMessages();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState([]);
  const [properties, setProperties] = useState([]);

  const load = useCallback(async () => {
    try {
      const [inboxRes, propsRes] = await Promise.all([
        api.get('/messages/inbox'),
        api.get('/properties/my'),
      ]);
      const fetchedThreads = inboxRes.data.threads || [];
      setThreads(fetchedThreads);
      setProperties(propsRes.data.properties || []);
      refreshUnread(fetchedThreads);
    } catch {
      // keep empty state
    } finally {
      setLoading(false);
    }
  }, [refreshUnread]);

  useEffect(() => { load(); }, [load]);

  // Build grouped structure
  const propertyThreads = threads.filter(t => !t.isDirect);

  // Map threads onto properties; include all properties (even those with no threads)
  const groups = properties.map(prop => {
    const pts = propertyThreads.filter(t => t.propertyId === prop.id);
    const unreadCount = pts.reduce((s, t) => s + (t.unreadCount || 0), 0);
    const latestAt = pts.reduce((best, t) => {
      const at = t.latestMessage?.sentAt;
      if (!at) return best;
      return (!best || new Date(at) > new Date(best)) ? at : best;
    }, null);
    return { property: prop, threads: pts, unreadCount, latestAt };
  }).sort((a, b) => {
    // unread first → latest message → no-thread properties last
    if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount;
    if (a.latestAt && b.latestAt) return new Date(b.latestAt) - new Date(a.latestAt);
    if (a.latestAt) return -1;
    if (b.latestAt) return 1;
    return 0;
  });

  const totalUnread = threads.reduce((s, t) => s + (t.unreadCount || 0), 0);

  if (loading) return <SkeletonList />;

  return (
    <div className="min-h-dvh bg-[#F5F0EB]">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#41271B]">Messages</h1>
            {totalUnread > 0 && (
              <span className="bg-[#975536] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {totalUnread}
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        className="max-w-2xl mx-auto px-4 py-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}
      >
        {groups.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {groups.map(group => (
              <PropertyRow
                key={group.property.id}
                group={group}
                onPress={() => navigate(`/landlord/messages/${group.property.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PropertyRow({ group, onPress }) {
  const { property, threads, unreadCount, latestAt } = group;
  const photo = property?.photos?.[0]?.filePath;
  const statusInfo = STATUS_LABEL[property?.status] || STATUS_LABEL.draft;
  const hasThreads = threads.length > 0;

  return (
    <button
      onClick={onPress}
      className="w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-50 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
      style={{ minHeight: 80 }}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Photo */}
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#EDE0CE] flex-shrink-0">
          {photo ? (
            <img src={photo} alt={property?.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#975536]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-[#41271B] text-sm truncate">{property?.title || 'Property'}</p>
            {unreadCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#975536] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.cls}`}>
              {statusInfo.label}
            </span>
            {property?.locationGeneral && (
              <span className="text-xs text-gray-400">{property.locationGeneral}</span>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          {hasThreads ? (
            <>
              <p className="text-xs text-gray-400">{threads.length} {threads.length === 1 ? 'conversation' : 'conversations'}</p>
              {latestAt && (
                <p className="text-[11px] text-gray-300">{timeAgo(latestAt)}</p>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-300">No messages</p>
          )}
          <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl p-12 text-center shadow-sm mt-2">
      <div className="w-14 h-14 bg-[#EDE0CE] rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 text-[#975536]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <p className="font-semibold text-[#41271B]">No messages yet</p>
      <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
        When tenants message you about a listing, they'll show here.
      </p>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="min-h-dvh bg-[#F5F0EB]">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 h-16" />
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm flex gap-3 items-center">
            <div className="w-14 h-14 rounded-xl bg-gray-200 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
