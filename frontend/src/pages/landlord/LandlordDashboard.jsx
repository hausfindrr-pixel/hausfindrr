import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import FeedbackSheet from '../../components/shared/FeedbackBubble';
import PushPromptCard from '../../components/shared/PushPromptCard';

const ID_TYPE_OPTIONS = [
  { value: 'passport',        label: 'Passport' },
  { value: 'drivers_licence', label: "Driver's Licence" },
  { value: 'nid',             label: 'National ID (NID)' },
];

const STATUS_INFO = {
  active:               { label: 'Verified',         cls: 'bg-green-50 text-green-700 border-green-200' },
  pending_verification: { label: 'Under review',     cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  rejected:             { label: 'Verification failed', cls: 'bg-red-50 text-red-700 border-red-200' },
};

export default function LandlordDashboard() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [idType, setIdType] = useState('passport');
  const [idFile, setIdFile] = useState(null);
  const [idLoading, setIdLoading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    api.get('/notifications').then(r => setNotifications(r.data.notifications || [])).catch(() => {});
  }, []);

  const statusInfo = STATUS_INFO[user?.status] || { label: user?.status || '—', cls: 'bg-gray-50 text-gray-600 border-gray-200' };

  async function handleIdUpload(e) {
    e.preventDefault();
    if (!idFile) return toast.error('Please select a file');
    setIdLoading(true);
    try {
      const form = new FormData();
      form.append('id_type', idType);
      form.append('id_document', idFile);
      await api.post('/auth/complete-profile', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refreshUser();
      toast.success('ID uploaded — your account is under review');
      setIdFile(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setIdLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#F5F0EB]">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-[#41271B]">Account</h1>
        </div>
      </div>

      <div
        className="max-w-2xl mx-auto px-4 py-6 space-y-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}
      >
        {/* Profile card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-[#975536] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'L'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#41271B] text-base truncate">{user?.name}</p>
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              {user?.accountCode && (
                <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {user.accountCode}</p>
              )}
            </div>
          </div>

          {/* Status badge */}
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${statusInfo.cls}`}>
            {user?.status === 'active' && (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {statusInfo.label}
          </span>

          {user?.status === 'pending_verification' && (
            <p className="text-xs text-amber-700 mt-3 leading-relaxed">
              Your ID is under review. You'll be able to list properties once verified — usually 1–2 business days.
            </p>
          )}
          {user?.status === 'rejected' && (
            <p className="text-xs text-red-700 mt-3 leading-relaxed">
              Verification failed. Contact us at <a href="mailto:info@hausfindrr.com" className="underline">info@hausfindrr.com</a>.
            </p>
          )}
        </div>

        {/* Push prompt — shown to verified landlords who haven't granted/denied yet */}
        {user?.status === 'active' && <PushPromptCard />}

        {/* ID upload banner — shown until profileComplete */}
        {user?.profileComplete === false && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-800">Add your ID to get Verified and publish listings</p>
                <p className="text-xs text-amber-700 mt-0.5">Your ID is kept private and deleted after 30 days. It is never shown to tenants.</p>
              </div>
            </div>
            <form onSubmit={handleIdUpload} className="space-y-3">
              <select
                value={idType}
                onChange={e => setIdType(e.target.value)}
                className="w-full border border-amber-200 rounded-xl px-3 py-2.5 text-sm bg-white text-[#41271B] focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {ID_TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <div
                className="border-2 border-dashed border-amber-300 rounded-xl p-4 text-center cursor-pointer hover:bg-amber-100/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {idFile ? (
                  <p className="text-sm text-amber-800 font-medium truncate">{idFile.name}</p>
                ) : (
                  <p className="text-sm text-amber-700">Tap to upload Passport or Driver's Licence</p>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={e => setIdFile(e.target.files[0] || null)}
                />
              </div>
              <button
                type="submit"
                disabled={idLoading || !idFile}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {idLoading ? 'Uploading…' : 'Upload ID'}
              </button>
            </form>
          </div>
        )}

        {/* Quick links */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 divide-y divide-gray-50">
          <Link
            to="/landlord/properties"
            className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
            style={{ minHeight: 56 }}
          >
            <svg className="w-5 h-5 text-[#975536] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="flex-1 text-sm font-medium text-[#41271B]">My Properties</span>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            to="/landlord/messages"
            className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
            style={{ minHeight: 56 }}
          >
            <svg className="w-5 h-5 text-[#975536] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="flex-1 text-sm font-medium text-[#41271B]">Messages</span>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            to="/landlord/new-listing"
            className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
            style={{ minHeight: 56 }}
          >
            <svg className="w-5 h-5 text-[#975536] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
            </svg>
            <span className="flex-1 text-sm font-medium text-[#41271B]">Add New Listing</span>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Send feedback */}
        <button
          onClick={() => setFeedbackOpen(true)}
          className="w-full flex items-center gap-3 px-5 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
          style={{ minHeight: 56 }}
        >
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="flex-1 text-sm font-medium text-[#41271B] text-left">Send feedback</span>
          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Legal */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 divide-y divide-gray-50">
          <Link
            to="/landlord-agreement"
            state={{ returnTo: '/landlord/dashboard' }}
            className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
            style={{ minHeight: 56 }}
          >
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="flex-1 text-sm font-medium text-[#41271B]">Landlord Agreement</span>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            to="/terms"
            state={{ returnTo: '/landlord/dashboard' }}
            className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
            style={{ minHeight: 56 }}
          >
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="flex-1 text-sm font-medium text-[#41271B]">Terms & Privacy</span>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#41271B] px-1">Notifications</p>
            {notifications.map(n => (
              <NotificationRow key={n.id} notification={n} />
            ))}
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="w-full text-sm font-semibold text-red-500 hover:text-red-700 bg-white hover:bg-red-50 border border-gray-100 rounded-2xl py-4 transition-colors shadow-sm"
          style={{ minHeight: 56 }}
        >
          Sign out
        </button>
      </div>

      <FeedbackSheet open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}

function NotificationRow({ notification }) {
  const diff = Date.now() - new Date(notification.createdAt).getTime();
  const m = Math.floor(diff / 60000);
  const timeAgo = m < 1 ? 'just now' : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m/60)}h ago` : `${Math.floor(m/1440)}d ago`;
  return (
    <div className="flex items-start gap-3.5 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="w-10 h-10 bg-[#975536] rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <p className="font-semibold text-[#41271B] text-sm">HausFindrr Support</p>
          <span className="text-xs text-[#975536]/70 bg-[#EDE0CE] px-1.5 py-0.5 rounded-full font-medium">Official</span>
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
