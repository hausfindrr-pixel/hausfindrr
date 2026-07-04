import { Link } from 'react-router-dom';
import { TOS_SECTIONS, TOS_VERSION } from '../constants/tos';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#41271b' }}>
              <span className="text-white text-xs font-bold">H</span>
            </div>
            <span className="font-bold text-gray-900 text-sm">HausFindrr</span>
          </Link>
          <Link
            to="/tenant/register"
            className="text-sm font-medium hover:underline"
            style={{ color: '#975536' }}
          >
            ← Back to Registration
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Terms of Service</h1>
          <p className="text-sm text-gray-400">
            HausFindrr · {TOS_VERSION} · Last updated July 2026
          </p>
        </div>

        <div className="space-y-8">
          {TOS_SECTIONS.map((section, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-3 text-base">{section.heading}</h2>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{section.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/tenant/register"
            className="inline-block px-6 py-3 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#975536' }}
          >
            Back to Registration
          </Link>
          <p className="text-xs text-gray-400 mt-4">
            Questions? Email us at{' '}
            <a href="mailto:support@hausfindrr.com" className="hover:underline" style={{ color: '#975536' }}>
              support@hausfindrr.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
