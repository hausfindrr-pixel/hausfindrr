import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '../../context/MessagesContext';
import api from '../../services/api';
import FeedbackCard from '../../components/shared/FeedbackCard';
import { shouldShowFeedback, markFeedbackShown } from '../../utils/feedbackState';

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

export default function TenantMessagesPage() {
  const navigate = useNavigate();
  const { refreshUnread } = useMessages();

  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState([]);
  const [showFeedbackCard, setShowFeedbackCard] = useState(false);
  const [directThreads, setDirectThreads] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const load = useCallback(async () => {
    try {
      const [inboxRes, annRes] = await Promise.all([
        api.get('/messages/inbox'),
        api.get('/announcements'),
      ]);
      const all = inboxRes.data.threads || [];
      const direct = all.filter(t => t.isDirect);
      const filtered = all.filter(t => !t.isDirect);
      setDirectThreads(direct);
      setThreads(filtered);
      setAnnouncements(annRes.data.announcements || []);
      refreshUnread(all);
      if (filtered.length > 0 && shouldShowFeedback()) {
        setShowFeedbackCard(true);
        markFeedbackShown();
      }
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  }, [refreshUnread]);

  useEffect(() => { load(); }, [load]);

  const totalUnread = [...threads, ...directThreads].reduce((s, t) => s + (t.unreadCount || 0), 0);

  if (loading) return <Skeleton />;

  return (
    <div className="min-h-dvh bg-[#F5F0EB]">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-2">
          <h1 className="text-xl font-bold text-[#41271B]">Messages</h1>
          {totalUnread > 0 && (
            <span className="bg-[#975536] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {totalUnread}
            </span>
          )}
        </div>
      </div>

      <div
        className="max-w-4xl mx-auto px-4 py-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}
      >
        {/* Admin announcements — read-only */}
        {announcements.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">Announcements</p>
            <div className="space-y-2">
              {announcements.map(a => (
                <div key={a.id} className="bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-50">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-lg bg-[#EDE0CE] flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-[#975536]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-[#41271B]">HausFindrr</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#EDE0CE] text-[#975536]">Announcement</span>
                    <span className="text-[11px] text-gray-300 ml-auto">{timeAgo(a.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{a.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin direct conversation — can reply */}
        {directThreads.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">Support</p>
            {directThreads.map(t => (
              <DirectMessageRow
                key={t.otherUser?.id}
                thread={t}
                onOpen={() => navigate(`/conversation/direct/${t.otherUser.id}`)}
              />
            ))}
          </div>
        )}

        {threads.length === 0 && directThreads.length === 0 && announcements.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm mt-2">
            <div className="w-14 h-14 bg-[#EDE0CE] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-[#975536]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="font-semibold text-[#41271B]">No messages yet</p>
            <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
              Message a landlord from any listing and your conversation will appear here.
            </p>
          </div>
        ) : threads.length > 0 ? (
          <>
            <div className="grid gap-2 md:grid-cols-2 md:gap-3">
              {threads.map(t => (
                <TenantConversationRow
                  key={`${t.propertyId}-${t.otherUser?.id}`}
                  thread={t}
                  onOpen={() => navigate(`/conversation/${t.propertyId}/${t.otherUser.id}`)}
                />
              ))}
            </div>
            {showFeedbackCard && (
              <div className="mt-3">
                <FeedbackCard onDismissed={() => setShowFeedbackCard(false)} />
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

function DirectMessageRow({ thread, onOpen }) {
  const hasUnread = thread.unreadCount > 0;
  return (
    <button
      onClick={onOpen}
      className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left bg-white rounded-2xl shadow-sm mb-2"
      style={{ minHeight: 72 }}
    >
      <div className="w-12 h-12 rounded-xl bg-[#EDE0CE] flex items-center justify-center flex-shrink-0">
        <svg className="w-6 h-6 text-[#975536]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className={`text-sm truncate ${hasUnread ? 'font-semibold text-[#41271B]' : 'font-medium text-gray-700'}`}>
            HausFindrr Support
          </p>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#EDE0CE] text-[#975536] flex-shrink-0">Official</span>
          {hasUnread && <span className="w-2 h-2 rounded-full bg-[#975536] flex-shrink-0" />}
        </div>
        <p className={`text-xs truncate ${hasUnread ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
          {thread.latestMessage?.content || 'Message from HausFindrr'}
        </p>
      </div>
      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        {thread.latestMessage?.sentAt && (
          <p className="text-[11px] text-gray-400">{timeAgo(thread.latestMessage.sentAt)}</p>
        )}
        {hasUnread && (
          <span className="w-5 h-5 rounded-full bg-[#975536] text-white text-[11px] font-bold flex items-center justify-center">
            {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
          </span>
        )}
      </div>
    </button>
  );
}

function TenantConversationRow({ thread, onOpen }) {
  const hasUnread = thread.unreadCount > 0;
  const photo = thread.property?.photos?.[0]?.filePath;
  const landlordFirst = (thread.otherUser?.name || 'Landlord').split(' ')[0];
  const price = thread.property?.price
    ? `K${Number(thread.property.price).toLocaleString()}${thread.property.rentFrequency ? `/${thread.property.rentFrequency}` : ''}`
    : null;
  const area = thread.property?.locationGeneral;

  return (
    <button
      onClick={onOpen}
      className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left bg-white rounded-2xl shadow-sm"
      style={{ minHeight: 72 }}
    >
      {/* Listing thumbnail */}
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#EDE0CE] flex-shrink-0">
        {photo ? (
          <img src={photo} alt={thread.property?.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-6 h-6 text-[#975536]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className={`text-sm truncate ${hasUnread ? 'font-semibold text-[#41271B]' : 'font-medium text-gray-700'}`}>
            {landlordFirst}
          </p>
          {hasUnread && <span className="w-2 h-2 rounded-full bg-[#975536] flex-shrink-0" />}
        </div>
        {(price || area) && (
          <p className="text-xs text-gray-500 truncate mb-0.5">
            {[price, area].filter(Boolean).join(' · ')}
          </p>
        )}
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

function Skeleton() {
  return (
    <div className="min-h-dvh bg-[#F5F0EB]">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 h-16" />
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="grid gap-2 md:grid-cols-2 md:gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 p-4 bg-white rounded-2xl shadow-sm">
              <div className="w-14 h-14 rounded-xl bg-gray-200 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
