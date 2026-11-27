import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import FeedbackSheet from '../../components/shared/FeedbackBubble';
import PushPromptCard from '../../components/shared/PushPromptCard';

const CLAY = '#975536';

function Row({ icon, label, onClick, to, state, danger = false, chevron = true }) {
  const inner = (
    <>
      <span className="flex-shrink-0 w-5 h-5 text-[#975536]">{icon}</span>
      <span className={`flex-1 text-sm font-medium ${danger ? 'text-red-500' : 'text-[#41271B]'}`}>{label}</span>
      {chevron && (
        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </>
  );

  const cls = `flex items-center gap-3 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors w-full text-left ${danger ? 'hover:bg-red-50' : ''}`;

  if (to) {
    return (
      <Link to={to} state={state} className={cls} style={{ minHeight: 56, textDecoration: 'none' }}>
        {inner}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={cls} style={{ minHeight: 56 }}>
      {inner}
    </button>
  );
}

const HeartSvg = (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);
const ChatSvg = (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);
const UserSvg = (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const LockSvg = (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);
const DocSvg = (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const FeedbackSvg = (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <h2 className="text-lg font-bold text-[#41271B]">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}

export default function TenantDashboard() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [feedbackOpen, setFeedbackOpen]   = useState(false);
  const [editModal, setEditModal]         = useState(false);
  const [pwModal, setPwModal]             = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [editForm, setEditForm]       = useState({ name: '', phone: '' });
  const [editLoading, setEditLoading] = useState(false);

  const [pwForm, setPwForm]       = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);

  const [deleteLoading, setDeleteLoading] = useState(false);

  function openEdit() {
    setEditForm({ name: user?.name || '', phone: user?.phone || '' });
    setEditModal(true);
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.phone.trim()) {
      toast.error('Name and phone are required');
      return;
    }
    setEditLoading(true);
    try {
      await api.patch('/auth/profile', editForm);
      await refreshUser();
      setEditModal(false);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  }

  async function handlePwSubmit(e) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setPwLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwModal(false);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    try {
      await api.delete('/auth/account');
      logout();
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete account');
      setDeleteLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#F5F0EB]">

      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-[#41271B]">Account</h1>
        </div>
      </div>

      <div
        className="max-w-2xl mx-auto px-4 py-6 space-y-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}
      >

        {/* Push prompt */}
        <PushPromptCard />

        {/* Profile card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0" style={{ backgroundColor: CLAY }}>
              {user?.name?.[0]?.toUpperCase() || 'T'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#41271B] text-base truncate">{user?.name}</p>
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* My activity */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 divide-y divide-gray-50">
          <Row icon={HeartSvg} label="My saved homes" onClick={() => navigate('/tenant/saved')} />
          <Row icon={ChatSvg}  label="My messages"    onClick={() => navigate('/tenant/messages')} />
        </div>

        {/* Account management */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 divide-y divide-gray-50">
          <Row icon={UserSvg} label="Edit profile"    onClick={openEdit} />
          <Row icon={LockSvg} label="Change password" onClick={() => setPwModal(true)} />
        </div>

        {/* Legal */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 divide-y divide-gray-50">
          <Row icon={DocSvg} label="Terms of Service" to="/terms"   state={{ returnTo: '/tenant/dashboard' }} />
          <Row icon={DocSvg} label="Privacy Policy"   to="/privacy" state={{ returnTo: '/tenant/dashboard' }} />
        </div>

        {/* Feedback */}
        <button
          onClick={() => setFeedbackOpen(true)}
          className="w-full flex items-center gap-3 px-5 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors text-left"
          style={{ minHeight: 56 }}
        >
          <span className="flex-shrink-0 w-5 h-5 text-gray-400">{FeedbackSvg}</span>
          <span className="flex-1 text-sm font-medium text-[#41271B]">Send feedback</span>
          <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Sign out */}
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="w-full text-sm font-semibold text-red-500 hover:text-red-700 bg-white hover:bg-red-50 border border-gray-100 rounded-2xl py-4 transition-colors shadow-sm"
          style={{ minHeight: 56 }}
        >
          Sign out
        </button>

        {/* Delete account */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-1">Delete account</p>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            This permanently removes your account, saved homes, and all your data. It cannot be undone.
          </p>
          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
            >
              Delete my account and data →
            </button>
          ) : (
            <div>
              <p className="text-sm text-red-600 font-semibold mb-3">
                Are you sure? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleteLoading ? 'Deleting…' : 'Yes, delete everything'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit profile modal */}
      {editModal && (
        <Modal title="Edit profile" onClose={() => setEditModal(false)}>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Full Name</label>
              <input
                className="input w-full"
                required
                value={editForm.name}
                onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Phone</label>
              <input
                className="input w-full"
                type="tel"
                required
                value={editForm.phone}
                onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <button
              type="submit"
              disabled={editLoading}
              className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-50"
            >
              {editLoading ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </Modal>
      )}

      {/* Change password modal */}
      {pwModal && (
        <Modal title="Change password" onClose={() => { setPwModal(false); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}>
          <form onSubmit={handlePwSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Current password</label>
              <input
                className="input w-full"
                type="password"
                required
                value={pwForm.currentPassword}
                onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">New password</label>
              <input
                className="input w-full"
                type="password"
                required
                minLength={8}
                value={pwForm.newPassword}
                onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Confirm new password</label>
              <input
                className="input w-full"
                type="password"
                required
                minLength={8}
                value={pwForm.confirmPassword}
                onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
              />
            </div>
            <button
              type="submit"
              disabled={pwLoading}
              className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-50"
            >
              {pwLoading ? 'Changing…' : 'Change password'}
            </button>
          </form>
        </Modal>
      )}

      <FeedbackSheet open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}
