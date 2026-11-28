import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/shared/Navbar';

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-primary' : 'bg-gray-200'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function SettingRow({ label, description, checked, onChange, disabled, locked }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{description}</p>}
        {locked && <p className="text-[11px] text-orange-500 mt-0.5">Required for account safety — cannot be turned off</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled || locked} />
    </div>
  );
}

export default function NotificationSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/notifications/settings').then(r => setSettings(r.data)).catch(() => {});
  }, []);

  async function update(field, value) {
    if (!settings) return;
    const next = { ...settings, [field]: value };
    setSettings(next);
    setSaving(true);
    try {
      await api.patch('/notifications/settings', { [field]: value });
    } catch { /* revert */ setSettings(settings); } finally {
      setSaving(false);
    }
  }

  if (!settings) return (
    <div className="min-h-screen bg-[#F5F0EB]">
      <Navbar />
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/notifications')} className="p-1 -ml-1 text-gray-500 hover:text-gray-900">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Notification settings</h1>
          {saving && <span className="text-xs text-gray-400 ml-auto">Saving…</span>}
        </div>

        <div className="space-y-4">
          {/* Push section */}
          <div className="bg-white rounded-2xl shadow-sm px-4 divide-y divide-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide py-3">Push notifications</p>
            <SettingRow
              label="Messages"
              description="When you receive a new message from a landlord or tenant"
              checked={settings.pushMessages}
              onChange={v => update('pushMessages', v)}
            />
            <SettingRow
              label="Verification &amp; listings"
              description="ID review updates and listing approvals"
              checked={settings.pushVerification}
              onChange={v => update('pushVerification', v)}
              locked
            />
            <SettingRow
              label="Saved listings"
              description="When a property you saved is rented, removed, or changes price"
              checked={settings.pushListings}
              onChange={v => update('pushListings', v)}
            />
          </div>

          {/* Email section */}
          <div className="bg-white rounded-2xl shadow-sm px-4 divide-y divide-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide py-3">Email notifications</p>
            <SettingRow
              label="Verification &amp; account"
              description="ID approval, rejection, and important account emails"
              checked={settings.emailVerification}
              onChange={v => update('emailVerification', v)}
              locked
            />
            <SettingRow
              label="Listing updates"
              description="When your listings are approved or removed"
              checked={settings.emailListingUpdates}
              onChange={v => update('emailListingUpdates', v)}
            />
          </div>

          {/* Account setup section */}
          <div className="bg-white rounded-2xl shadow-sm px-4 divide-y divide-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide py-3">Account setup</p>
            <SettingRow
              label="Account setup reminders"
              description="Gentle nudges to upload your ID or add your first listing"
              checked={settings.setupReminders ?? true}
              onChange={v => update('setupReminders', v)}
            />
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6 leading-relaxed">
          Verification and safety notifications cannot be turned off — they protect your account.
        </p>
      </div>
    </div>
  );
}
