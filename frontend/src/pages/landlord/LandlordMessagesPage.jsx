import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

const PREVIEW_COUNT = 3;

export default function LandlordMessagesPage() {
  const { refreshUnread } = useMessages();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState([]);
  const [properties, setProperties] = useState([]);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState({});
  const didScrollRef = useRef(false);

  const params = new URLSearchParams(location.search);
  const deepLink = params.get('listing');

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

  // Deep-link scroll after data loads
  useEffect(() => {
    if (!deepLink || loading || didScrollRef.current) return;
    const el = document.getElementById(`listing-${deepLink}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      didScrollRef.current = true;
    }
  }, [deepLink, loading]);

  // Build grouped structure
  const propertyThreads = threads.filter(t => !t.isDirect);

  const groups = Object.values(
    propertyThreads.reduce((acc, t) => {
      const pid = t.propertyId;
      if (!acc[pid]) {
        const full = properties.find(p => p.id === pid);
        acc[pid] = {
          property: full ? { ...t.property, ...full } : t.property,
          threads: [],
          unreadCount: 0,
          latestAt: null,
        };
      }
      acc[pid].threads.push(t);
      acc[pid].unreadCount += t.unreadCount || 0;
      const at = t.latestMessage?.sentAt;
      if (at && (!acc[pid].latestAt || new Date(at) > new Date(acc[pid].latestAt))) {
        acc[pid].latestAt = at;
      }
      return acc;
    }, {})
  ).sort((a, b) => {
    if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount;
    return new Date(b.latestAt || 0) - new Date(a.latestAt || 0);
  });

  const filtered = filter === 'unread' ? groups.filter(g => g.unreadCount > 0) : groups;
  const totalUnread = threads.reduce((s, t) => s + (t.unreadCount || 0), 0);

  if (loading) return <SkeletonInbox />;

  return (
    <div className="min-h-dvh bg-[#F5F0EB]">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 pt-4 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <h1 className="text-xl font-bold text-[#41271B]">Messages</h1>
            {totalUnread > 0 && (
              <span className="bg-[#975536] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {totalUnread}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {['all', 'unread'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-[#41271B] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'All' : 'Unread'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content — no inner scroll, page scrolls */}
      <div
        className="max-w-4xl mx-auto px-4 py-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}
      >
        {threads.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm mt-2">
            <p className="text-gray-500 text-sm">No unread messages</p>
          </div>
        ) : (
          <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 md:items-start">
            {filtered.map(group => (
              <ListingSection
                key={group.property?.id}
                group={group}
                isExpanded={!!expanded[group.property?.id]}
                onToggle={() =>
                  setExpanded(e => ({ ...e, [group.property?.id]: !e[group.property?.id] }))
                }
                onOpen={thread =>
                  navigate(`/conversation/${thread.propertyId}/${thread.otherUser.id}`)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ListingSection({ group, isExpanded, onToggle, onOpen }) {
  const { property, threads, unreadCount } = group;
  const photo = property?.photos?.[0]?.filePath;
  const statusInfo = STATUS_LABEL[property?.status] || STATUS_LABEL.draft;
  const visible = isExpanded ? threads : threads.slice(0, PREVIEW_COUNT);
  const hidden = threads.length - PREVIEW_COUNT;

  return (
    <div id={`listing-${property?.id}`} className="bg-white rounded-2xl overflow-hidden shadow-sm">
      {/* Listing header card */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
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
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#41271B] text-sm truncate">{property?.title || 'Property'}</p>
          <p className="text-xs text-gray-500 truncate">
            {[
              property?.locationGeneral,
              property?.price
                ? `K${Number(property.price).toLocaleString()}${property.rentFrequency ? `/${property.rentFrequency}` : ''}`
                : null,
            ].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.cls}`}>
            {statusInfo.label}
          </span>
          {unreadCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#975536] text-white text-[11px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Conversation rows — no inner scroll */}
      <div className="divide-y divide-gray-50">
        {visible.map(t => (
          <ConversationRow key={t.otherUser.id} thread={t} onOpen={() => onOpen(t)} />
        ))}
      </div>

      {/* See all / show less */}
      {hidden > 0 && !isExpanded && (
        <button
          onClick={onToggle}
          className="w-full text-center py-3.5 text-sm text-[#975536] font-medium hover:bg-[#EDE0CE]/30 transition-colors border-t border-gray-50"
          style={{ minHeight: 44 }}
        >
          See all ({threads.length})
        </button>
      )}
      {isExpanded && threads.length > PREVIEW_COUNT && (
        <button
          onClick={onToggle}
          className="w-full text-center py-3.5 text-sm text-gray-400 font-medium hover:bg-gray-50 transition-colors border-t border-gray-50"
          style={{ minHeight: 44 }}
        >
          Show less
        </button>
      )}
    </div>
  );
}

function ConversationRow({ thread, onOpen }) {
  const hasUnread = thread.unreadCount > 0;
  const firstName = (thread.otherUser?.name || 'Tenant').split(' ')[0];

  return (
    <button
      onClick={onOpen}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
      style={{ minHeight: 60 }}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold ${
        hasUnread ? 'bg-[#975536] text-white' : 'bg-[#EDE0CE] text-[#975536]'
      }`}>
        {firstName[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`text-sm truncate ${hasUnread ? 'font-semibold text-[#41271B]' : 'font-medium text-gray-700'}`}>
            {firstName}
          </p>
          {hasUnread && <span className="w-2 h-2 rounded-full bg-[#975536] flex-shrink-0" />}
        </div>
        <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
          {thread.latestMessage?.content || 'No messages yet'}
        </p>
      </div>
      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        {thread.latestMessage?.sentAt && (
          <p className="text-[11px] text-gray-400">{timeAgo(thread.latestMessage.sentAt)}</p>
        )}
        <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
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
        When tenants message you about a house, they'll show here.
      </p>
    </div>
  );
}

function SkeletonInbox() {
  return (
    <div className="min-h-dvh bg-[#F5F0EB]">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 h-24" />
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="flex gap-3 p-4 border-b border-gray-100">
              <div className="w-14 h-14 rounded-xl bg-gray-200 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
              </div>
            </div>
            {[1, 2].map(j => (
              <div key={j} className="flex gap-3 px-4 py-4 border-b border-gray-50 last:border-0">
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3.5 bg-gray-200 rounded animate-pulse w-1/3" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
