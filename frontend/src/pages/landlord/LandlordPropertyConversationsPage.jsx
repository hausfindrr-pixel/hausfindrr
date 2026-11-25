import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

export default function LandlordPropertyConversationsPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { refreshUnread } = useMessages();

  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState([]);
  const [property, setProperty] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      const [inboxRes, propRes] = await Promise.all([
        api.get('/messages/inbox'),
        api.get(`/properties/${propertyId}`),
      ]);
      const all = (inboxRes.data.threads || []).filter(
        t => !t.isDirect && t.propertyId === propertyId
      );
      setThreads(all);
      setProperty(propRes.data.property || propRes.data);
      refreshUnread(inboxRes.data.threads || []);
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  }, [propertyId, refreshUnread]);

  useEffect(() => { load(); }, [load]);

  const displayed = filter === 'unread'
    ? threads.filter(t => t.unreadCount > 0)
    : threads;

  const unreadTotal = threads.reduce((s, t) => s + (t.unreadCount || 0), 0);
  const photo = property?.photos?.[0]?.filePath;
  const statusInfo = STATUS_LABEL[property?.status] || STATUS_LABEL.draft;

  if (loading) return <Skeleton />;

  return (
    <div className="min-h-dvh bg-[#F5F0EB]">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto">
          {/* Back + title row */}
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => navigate('/landlord/messages')}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors -ml-2 flex-shrink-0"
              aria-label="Back to messages"
            >
              <svg className="w-5 h-5 text-[#41271B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Property mini-card */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-lg overflow-hidden bg-[#EDE0CE] flex-shrink-0">
                {photo ? (
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#975536]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#41271B] text-sm truncate leading-tight">
                  {property?.title || 'Property'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusInfo.cls}`}>
                    {statusInfo.label}
                  </span>
                  {property?.locationGeneral && (
                    <span className="text-[11px] text-gray-400 truncate">{property.locationGeneral}</span>
                  )}
                </div>
              </div>
            </div>

            {unreadTotal > 0 && (
              <span className="bg-[#975536] text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                {unreadTotal}
              </span>
            )}
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 px-4 pb-3">
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

      {/* Conversation list */}
      <div
        className="max-w-2xl mx-auto px-4 py-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}
      >
        {threads.length === 0 ? (
          <EmptyState />
        ) : displayed.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm mt-2">
            <p className="text-gray-500 text-sm">No unread messages</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {displayed.map((t, i) => (
              <ConversationRow
                key={t.otherUser?.id}
                thread={t}
                isLast={i === displayed.length - 1}
                onOpen={() => navigate(`/conversation/${propertyId}/${t.otherUser.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationRow({ thread, isLast, onOpen }) {
  const hasUnread = thread.unreadCount > 0;
  const firstName = (thread.otherUser?.name || 'Tenant').split(' ')[0];

  return (
    <button
      onClick={onOpen}
      className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left ${
        !isLast ? 'border-b border-gray-50' : ''
      }`}
      style={{ minHeight: 64 }}
    >
      {/* Avatar */}
      <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold ${
        hasUnread ? 'bg-[#975536] text-white' : 'bg-[#EDE0CE] text-[#975536]'
      }`}>
        {firstName[0].toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className={`text-sm truncate ${hasUnread ? 'font-semibold text-[#41271B]' : 'font-medium text-gray-700'}`}>
            {firstName}
          </p>
          {hasUnread && <span className="w-2 h-2 rounded-full bg-[#975536] flex-shrink-0" />}
        </div>
        <p className={`text-xs truncate ${hasUnread ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
          {thread.latestMessage?.content || 'No messages yet'}
        </p>
      </div>

      {/* Time + chevron */}
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
      <p className="font-semibold text-[#41271B]">No enquiries yet</p>
      <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
        When tenants message you about this listing, they'll appear here.
      </p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="min-h-dvh bg-[#F5F0EB]">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 h-24" />
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 px-4 py-4 border-b border-gray-50 last:border-0">
              <div className="w-11 h-11 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3.5 bg-gray-200 rounded animate-pulse w-1/3" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
