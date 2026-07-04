import { useState } from 'react';
import api from '../../services/api';

const COMPLAINT_TYPES = [
  { value: 'landlord_not_responding',   label: 'Landlord not responding' },
  { value: 'listing_details_incorrect', label: 'Listing details incorrect' },
  { value: 'suspicious_activity',       label: 'Suspicious activity' },
  { value: 'other',                     label: 'Other' },
];

const PLATFORM_TYPES = [
  { value: 'platform_feedback', label: 'General feedback' },
  { value: 'listing_details_incorrect', label: 'Incorrect listing info' },
  { value: 'suspicious_activity', label: 'Suspicious listing' },
  { value: 'other', label: 'Other' },
];

export default function FeedbackBubble({ mode = 'landlord', landlordId, propertyId }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('choice'); // 'choice' | 'complaint' | 'done'
  const [type, setType] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const types = mode === 'landlord' ? COMPLAINT_TYPES : PLATFORM_TYPES;

  function reset() {
    setView('choice');
    setType('');
    setDetails('');
  }

  function handleClose() {
    setOpen(false);
    setTimeout(reset, 300);
  }

  async function handleSubmit() {
    if (!type) return;
    setSubmitting(true);
    try {
      await api.post('/complaints', {
        type,
        details,
        context: mode,
        landlordId: mode === 'landlord' ? landlordId : null,
        propertyId: mode === 'landlord' ? propertyId : null,
      });
      setView('done');
    } catch {
      // silently fail — still show done to user
      setView('done');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 md:bottom-6 md:right-6 flex items-center gap-2 bg-white shadow-lg border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-150"
      >
        <span className="text-base">{mode === 'landlord' ? '😊' : '💬'}</span>
        <span className="max-w-[140px] leading-tight text-left">
          {mode === 'landlord' ? "How's it going?" : 'Got feedback?'}
        </span>
      </button>

      {/* Backdrop + modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative w-full max-w-sm mx-auto bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl px-6 pt-5 pb-8 sm:pb-6 animate-in">

            {/* Drag handle (mobile) */}
            <div className="sm:hidden flex justify-center mb-4">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* ── Choice view ── */}
            {view === 'choice' && (
              <div className="space-y-4">
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {mode === 'landlord' ? "How's it going with your landlord? 😊" : "Got feedback for us? 😊"}
                  </p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {mode === 'landlord'
                      ? 'Let us know how things are going.'
                      : 'Help us make HausFindrr better.'}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-colors text-left"
                >
                  <span className="text-2xl">👍</span>
                  <div>
                    <p className="font-semibold text-green-800 text-sm">Everything's great!</p>
                    <p className="text-xs text-green-600">Thanks, glad to hear it</p>
                  </div>
                </button>
                <button
                  onClick={() => setView('complaint')}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
                >
                  <span className="text-2xl">🙁</span>
                  <div>
                    <p className="font-semibold text-amber-800 text-sm">I have a concern</p>
                    <p className="text-xs text-amber-600">Let us know what's up</p>
                  </div>
                </button>
              </div>
            )}

            {/* ── Complaint form ── */}
            {view === 'complaint' && (
              <div className="space-y-4">
                <div>
                  <button onClick={() => setView('choice')} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-3 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                  <p className="text-lg font-bold text-gray-900">Tell us what's happening</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    What's the issue?
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={type}
                    onChange={e => setType(e.target.value)}
                  >
                    <option value="">Select an issue…</option>
                    {types.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Tell us more <span className="text-gray-300 normal-case font-normal">(optional)</span>
                  </label>
                  <textarea
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    rows={3}
                    placeholder="Any extra details that would help us…"
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!type || submitting}
                  className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  {submitting ? 'Sending…' : 'Submit'}
                </button>
              </div>
            )}

            {/* ── Done state ── */}
            {view === 'done' && (
              <div className="text-center py-4 space-y-3">
                <div className="text-4xl">💚</div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Thanks for letting us know!</p>
                  <p className="text-sm text-gray-500 mt-1">We'll look into it and take the right action.</p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
