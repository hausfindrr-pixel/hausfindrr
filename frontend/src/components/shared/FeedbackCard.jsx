import { useState } from 'react';
import api from '../../services/api';
import { dismissFeedback } from '../../utils/feedbackState';

const FACES = [
  { score: 1, emoji: '😞' },
  { score: 2, emoji: '😕' },
  { score: 3, emoji: '😐' },
  { score: 4, emoji: '🙂' },
  { score: 5, emoji: '😄' },
];

// Inline (non-floating) feedback nudge shown at good moments.
// Parent is responsible for the show/hide gate (shouldShowFeedback() + markFeedbackShown()).
// onDismissed: called after dismiss or submit so parent removes it from the DOM.
export default function FeedbackCard({ onDismissed }) {
  const [rating, setRating] = useState(0);
  const [view, setView] = useState('prompt'); // 'prompt' | 'done'
  const [sending, setSending] = useState(false);

  function handleDismiss() {
    dismissFeedback();
    onDismissed?.();
  }

  async function handleRate(score) {
    setRating(score);
    setSending(true);
    try {
      await api.post('/complaints', {
        type: 'platform_feedback',
        details: `Quick rating: ${score}/5`,
        context: 'platform',
      });
    } catch {
      // silent
    } finally {
      setSending(false);
      setView('done');
      dismissFeedback();
      setTimeout(() => onDismissed?.(), 2500);
    }
  }

  if (view === 'done') {
    return (
      <div className="mx-4 mb-4 rounded-2xl bg-green-50 border border-green-100 px-4 py-3 flex items-center gap-3">
        <span className="text-xl">💚</span>
        <p className="text-sm font-semibold text-green-800">Thanks for the feedback!</p>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-4 rounded-2xl bg-white border border-gray-100 shadow-sm px-4 py-3.5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-sm font-semibold text-gray-800 leading-snug">
          How's HausFindrr working for you?
        </p>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors -mt-0.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex gap-1.5">
        {FACES.map(f => (
          <button
            key={f.score}
            onClick={() => !sending && handleRate(f.score)}
            className={`flex-1 py-2 rounded-xl border text-xl transition-all ${
              rating === f.score
                ? 'border-primary bg-primary/5 scale-105'
                : 'border-gray-100 hover:border-gray-200 hover:scale-105'
            }`}
            aria-label={`Rate ${f.score} out of 5`}
          >
            {f.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
