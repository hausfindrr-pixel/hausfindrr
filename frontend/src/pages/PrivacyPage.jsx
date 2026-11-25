import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PRIVACY_SECTIONS, PRIVACY_VERSION, PRIVACY_EFFECTIVE_DATE } from '../constants/privacy';
import Footer from '../components/shared/Footer';

const BACK_LABELS = {
  '/landlord/dashboard': 'Back to Account',
  '/tenant/dashboard': 'Back to Account',
  '/landlord/register': 'Back to Landlord Sign-up',
  '/tenant/register': 'Back to Tenant Sign-up',
  '/': 'Back to Home',
};

export default function PrivacyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const returnTo = location.state?.returnTo;
  const backLabel = returnTo ? (BACK_LABELS[returnTo] || 'Back') : 'Back';

  function handleBack() {
    if (returnTo) navigate(returnTo);
    else navigate(-1);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#41271b' }}>
              <span className="text-white text-xs font-bold">H</span>
            </div>
            <span className="font-bold text-gray-900 text-sm">HausFindrr</span>
          </Link>
          <button
            onClick={handleBack}
            className="text-sm font-medium hover:underline"
            style={{ color: '#975536', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ← {backLabel}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Privacy Policy</h1>
          <p className="text-sm text-gray-400">
            HausFindrr · {PRIVACY_VERSION} · Effective {PRIVACY_EFFECTIVE_DATE}
          </p>
        </div>

        <div className="space-y-8">
          {PRIVACY_SECTIONS.map((section, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-3 text-base">{section.heading}</h2>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{section.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            <Link to="/terms" className="text-sm font-medium hover:underline" style={{ color: '#975536' }}>
              Terms of Service
            </Link>
            <span className="text-gray-300">·</span>
            <Link to="/landlord-agreement" className="text-sm font-medium hover:underline" style={{ color: '#975536' }}>
              Landlord Agreement
            </Link>
          </div>
          <p className="text-xs text-gray-400">
            Questions? Email{' '}
            <a href="mailto:info@hausfindrr.com" className="hover:underline" style={{ color: '#975536' }}>
              info@hausfindrr.com
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
