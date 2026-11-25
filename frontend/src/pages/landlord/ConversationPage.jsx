import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMessages } from '../../context/MessagesContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const LANDLORD_QUICK_REPLIES = [
  "Yes, it's available",
  "When would you like to view?",
  "Sorry, it's taken",
];

const TENANT_QUICK_STARTERS = [
  "Is this still available?",
  "Can I view it this week?",
  "What's included in the rent?",
];

const SAFETY_KEY = (pid, uid) => `safety-dismissed-${pid}-${uid}`;

function timeLabel(date) {
  return new Date(date).toLocaleTimeString('en-PG', { hour: '2-digit', minute: '2-digit' });
}

export default function ConversationPage() {
  const { propertyId, otherUserId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshUnread } = useMessages();

  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [property, setProperty] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportType, setReportType] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSending, setReportSending] = useState(false);
  const [atBottom, setAtBottom] = useState(true);

  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const pollRef = useRef(null);

  const fetchMessages = useCallback(async (markRead = false) => {
    try {
      const { data } = await api.get(`/messages/${propertyId}/${otherUserId}`);
      setMessages(data.messages || []);

      // Extract metadata from messages
      if (data.messages?.length) {
        const first = data.messages[0];
        const other = first.senderId === user.id ? first.receiver : first.sender;
        if (other && !otherUser) setOtherUser(other);
      }

      if (markRead) {
        await api.patch(`/messages/${propertyId}/${otherUserId}/read`).catch(() => {});
        refreshUnread();
      }
    } catch {
      // silent
    }
  }, [propertyId, otherUserId, user.id, otherUser, refreshUnread]);

  const fetchProperty = useCallback(async () => {
    try {
      const { data } = await api.get(`/properties/${propertyId}`);
      setProperty(data.property || data);
    } catch {
      // silent
    }
  }, [propertyId]);

  useEffect(() => {
    const bannerKey = SAFETY_KEY(propertyId, otherUserId);
    setShowBanner(!localStorage.getItem(bannerKey));

    Promise.all([fetchMessages(true), fetchProperty()]).finally(() => setLoading(false));

    // Poll every 5 seconds
    pollRef.current = setInterval(() => fetchMessages(false), 5000);
    return () => clearInterval(pollRef.current);
  }, [propertyId, otherUserId]);

  // Auto-scroll when messages update (only if at bottom)
  useEffect(() => {
    if (atBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 60);
  }

  function dismissBanner() {
    localStorage.setItem(SAFETY_KEY(propertyId, otherUserId), '1');
    setShowBanner(false);
  }

  async function send(e) {
    e?.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    const content = text.trim();
    setText('');
    try {
      const { data } = await api.post('/messages', { propertyId, receiverId: otherUserId, content });
      setMessages(prev => [...prev, data.message]);
      setAtBottom(true);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch {
      toast.error('Failed to send');
      setText(content);
    } finally {
      setSending(false);
    }
  }

  function useQuickReply(text) {
    setText(text);
    inputRef.current?.focus();
  }

  function shareNumber() {
    if (user?.phone) {
      setText(`My phone number is ${user.phone}`);
      inputRef.current?.focus();
    } else {
      toast('Phone number not set on your account');
    }
  }

  async function submitReport(e) {
    e.preventDefault();
    if (!reportType) return;
    setReportSending(true);
    try {
      await api.post('/complaints', {
        propertyId,
        reportedUserId: otherUserId,
        type: reportType,
        details: reportDetails,
      });
      toast.success('Report submitted');
      setShowReport(false);
      setReportType('');
      setReportDetails('');
    } catch {
      toast.error('Failed to submit report');
    } finally {
      setReportSending(false);
    }
  }

  const tenantFirstName = (otherUser?.name || 'Tenant').split(' ')[0];
  const listingTitle = property?.title || '';
  const isLandlord = user?.role === 'landlord';
  const isTenant = user?.role === 'tenant';
  const quickReplies = isLandlord
    ? LANDLORD_QUICK_REPLIES
    : (isTenant && messages.length === 0 ? TENANT_QUICK_STARTERS : []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: '100dvh', backgroundColor: '#F5F0EB' }}>
        <div className="w-8 h-8 border-2 border-[#975536] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Full-screen conversation — no bottom nav on this route */}
      <div
        className="flex flex-col bg-[#F5F0EB]"
        style={{ height: '100dvh' }}
      >
        {/* Header */}
        <header className="flex-shrink-0 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 px-4 py-3" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors -ml-2 flex-shrink-0"
              aria-label="Back"
            >
              <svg className="w-5 h-5 text-[#41271B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#41271B] text-base leading-tight truncate">{tenantFirstName}</p>
              {listingTitle && (
                <p className="text-xs text-gray-500 truncate">{listingTitle}</p>
              )}
            </div>
          </div>
        </header>

        {/* Safety banner */}
        {showBanner && (
          <div className="flex-shrink-0 bg-amber-50 border-b border-amber-100 px-4 py-3 flex items-start gap-3">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-amber-800 flex-1 leading-relaxed">
              Never pay money before viewing in person and signing an agreement. HausFindrr never asks for payment.
            </p>
            <button onClick={dismissBanner} className="text-amber-400 hover:text-amber-600 flex-shrink-0 p-0.5" aria-label="Dismiss">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Tenant: small listing card linking back to the listing */}
        {isTenant && property && (
          <div className="flex-shrink-0 px-4 py-2 border-b border-gray-100 bg-white">
            <Link
              to={`/property/${propertyId}`}
              className="flex items-center gap-3 bg-gray-50 rounded-xl p-2.5 hover:bg-[#EDE0CE]/40 transition-colors"
            >
              {property.photos?.[0]?.filePath ? (
                <img src={property.photos[0].filePath} alt={property.title} className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-lg bg-[#EDE0CE] flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#975536]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-[#41271B] truncate">{property.title}</p>
                  {property.landlordVerified && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 flex-shrink-0">✓ Verified</span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 truncate">
                  {[
                    property.price ? `K${Number(property.price).toLocaleString()}` : null,
                    property.locationGeneral,
                  ].filter(Boolean).join(' · ')}
                </p>
              </div>
              <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

        {/* Messages — this area scrolls */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
          onScroll={handleScroll}
        >
          {messages.length === 0 && (
            <p className="text-center text-gray-400 text-sm pt-8">No messages yet. Say hello!</p>
          )}
          {messages.map(m => {
            const mine = m.senderId === user.id;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  mine
                    ? 'bg-[#975536] text-white rounded-br-sm'
                    : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
                }`}>
                  <p>{m.content}</p>
                  <p className={`text-[11px] mt-1 ${mine ? 'text-white/60' : 'text-gray-400'}`}>
                    {timeLabel(m.sentAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input bar — pinned at the bottom, sits above keyboard on iOS */}
        <div
          className="flex-shrink-0 bg-white border-t border-gray-100"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* Quick replies / quick starters */}
          {quickReplies.length > 0 && (
            <div className="flex gap-2 px-4 pt-2.5 pb-1 overflow-x-auto scrollbar-hide">
              {quickReplies.map(qr => (
                <button
                  key={qr}
                  onClick={() => useQuickReply(qr)}
                  className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border border-[#975536]/30 text-[#975536] bg-[#EDE0CE]/40 hover:bg-[#EDE0CE] active:bg-[#EDE0CE] transition-colors whitespace-nowrap"
                  style={{ minHeight: 32 }}
                >
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <form onSubmit={send} className="flex gap-2 px-4 py-2 items-end">
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              placeholder="Message…"
              rows={1}
              disabled={sending}
              className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#975536] focus:ring-1 focus:ring-[#975536]/30 bg-gray-50 leading-normal"
              style={{ maxHeight: 120, overflowY: 'auto', minHeight: 44, fontSize: 16 }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="w-11 h-11 rounded-full bg-[#975536] text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-[#41271B] active:bg-[#41271B] transition-colors"
              aria-label="Send"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>

          {/* Action links */}
          <div className="flex items-center gap-4 px-5 pb-2.5">
            <button
              onClick={() => setShowReport(true)}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              style={{ minHeight: 32 }}
            >
              Report conversation
            </button>
            <button
              onClick={() => toast('Blocking coming soon')}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              style={{ minHeight: 32 }}
            >
              Block
            </button>
            <button
              onClick={shareNumber}
              className="text-xs text-[#975536] hover:text-[#41271B] font-medium transition-colors ml-auto"
              style={{ minHeight: 32 }}
            >
              Share my number
            </button>
          </div>
        </div>
      </div>

      {/* Report modal */}
      {showReport && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setShowReport(false)}
        >
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
            <h3 className="text-base font-bold text-[#41271B] mb-4">Report this conversation</h3>
            <form onSubmit={submitReport} className="space-y-4">
              <select
                value={reportType}
                onChange={e => setReportType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50 focus:outline-none focus:border-[#975536]"
                required
              >
                <option value="">Select reason…</option>
                <option value="scam">Possible scam or fraud</option>
                <option value="harassment">Harassment or abuse</option>
                <option value="spam">Spam or advertising</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="other">Other</option>
              </select>
              <textarea
                value={reportDetails}
                onChange={e => setReportDetails(e.target.value)}
                placeholder="Tell us more (optional)"
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50 resize-none focus:outline-none focus:border-[#975536]"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReport(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportSending || !reportType}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {reportSending ? 'Submitting…' : 'Submit report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
