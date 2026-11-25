import { useState } from 'react';
import api from '../../services/api';

const FACES = [
  { score: 1, emoji: '😞', label: 'Poor' },
  { score: 2, emoji: '😕', label: 'Fair' },
  { score: 3, emoji: '😐', label: 'Okay' },
  { score: 4, emoji: '🙂', label: 'Good' },
  { score: 5, emoji: '😄', label: 'Great' },
];

// Bottom sheet feedback form — no floating trigger.
// Open/close is controlled by the parent via open + onClose props.
export default function FeedbackSheet({ open, onClose }) {
  const [rating, setRating] = useState(0);
  const [details, setDetails] = useState('');
  const [view, setView] = useState('form'); // 'form' | 'done'
  const [submitting, setSubmitting] = useState(false);

  function handleClose() {
    onClose();
    // Reset after the sheet animates out
    setTimeout(() => { setRating(0); setDetails(''); setView('form'); }, 350);
  }

  async function handleSend() {
    if (!rating) return;
    setSubmitting(true);
    try {
      await api.post('/complaints', {
        type: 'platform_feedback',
        details: `Rating: ${rating}/5${details ? ` — ${details}` : ''}`,
        context: 'platform',
      });
    } catch {
      // silent — still show thanks
    } finally {
      setSubmitting(false);
      setView('done');
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-sm mx-auto bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl px-6 pt-5 pb-8 sm:pb-6">

        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center mb-4">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {view === 'form' ? (
          <div className="space-y-5">
            <div>
              <p className="text-lg font-bold text-gray-900">How's HausFindrr working for you?</p>
              <p className="text-sm text-gray-400 mt-0.5">Your feedback helps us improve.</p>
            </div>

            {/* Face rating */}
            <div className="flex justify-between gap-1">
              {FACES.map(f => (
                <button
                  key={f.score}
                  type="button"
                  onClick={() => setRating(f.score)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all ${
                    rating === f.score
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <span className="text-2xl leading-none">{f.emoji}</span>
                  <span className={`text-[10px] font-semibold ${rating === f.score ? 'text-primary' : 'text-gray-400'}`}>
                    {f.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Optional message */}
            <textarea
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              rows={2}
              placeholder="Anything else to share? (optional)"
              value={details}
              onChange={e => setDetails(e.target.value)}
            />

            <button
              onClick={handleSend}
              disabled={!rating || submitting}
              className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              {submitting ? 'Sending…' : 'Send feedback'}
            </button>
          </div>
        ) : (
          <div className="text-center py-6 space-y-3">
            <div className="text-4xl">💚</div>
            <div>
              <p className="font-bold text-gray-900 text-lg">Thanks!</p>
              <p className="text-sm text-gray-500 mt-1">We read every piece of feedback.</p>
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
  );
}
