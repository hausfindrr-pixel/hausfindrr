import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Footer from '../../components/shared/Footer';
import GuideBox from '../../components/shared/GuideBox';

const ID_TYPE_OPTIONS = [
  { value: 'passport', label: 'Passport' },
  { value: 'drivers_licence', label: "Driver's Licence" },
  { value: 'nid', label: 'National ID (NID)' },
];

const AGREEMENT_TEXT = `HAUSFINDRR LANDLORD AGREEMENT
Code of Conduct & Platform Policy
Version 1.0 — Effective July 2026

1. WHO THIS AGREEMENT APPLIES TO

This agreement applies to any person or entity ("Landlord") who registers on HausFindrr with the intention of listing residential or commercial properties for rent. By completing the sign-up process and ticking the confirmation box, you enter into this legally binding agreement with HausFindrr.

2. LISTING ACCURACY

All information in your property listings — including price, location, photographs, amenities, and availability — must be accurate and current at all times. You must update or remove any listing that is no longer available. Posting misleading, false, or duplicate listings is a serious violation of this agreement.

3. RENTED STATUS OBLIGATION

You are required to mark your listing as "Rented" as soon as a tenant has agreed to rent your property. Leaving an unavailable property listed as active misleads other tenants who are searching in good faith.

4. LANDLORD IDENTITY VERIFICATION

You must submit a valid government-issued identity document as part of your registration. All documents submitted must be genuine and belong to you. Submitting false or fraudulent documents is a criminal offence under Papua New Guinea law.

5. CONTACT DETAILS & TENANT COMMUNICATION

5.1 Your name and your listing pin are visible to registered users on HausFindrr. Your phone number is not shown on your listing or profile. If you choose to share your phone number with a tenant during a conversation, that is your decision — HausFindrr will not share it automatically.

5.2 You agree to use the Platform only for genuine rental enquiries and to respond professionally and honestly to all tenant messages.

5.3 You must never request any payment, deposit, or fee from a tenant before they have viewed the property in person and signed a written rental agreement.

5.4 When using HausFindrr messaging you agree to:
• Communicate honestly and politely at all times
• Not send spam, repeated unsolicited messages, or advertising
• Not harass, threaten, or intimidate any user
• Not request any pre-viewing fee or payment through HausFindrr messages
HausFindrr staff may read a conversation that has been reported or is under investigation for fraud or misconduct, and every such access is logged.

5.5 HausFindrr shows you statistics about your listings, including how many times each listing has been viewed and how many conversations have been started about it. HausFindrr may use these totals in aggregate, non-identifiable form to run and improve the platform.

6. RIGHT TO LIST

By listing a property on HausFindrr, you confirm that:
• You are the legal owner of the property, or
• You have the owner's written authority to list and rent the property on their behalf, and
• You have the right to enter into a rental agreement in respect of that property.

Listing a property without the right to do so is fraud and may result in criminal prosecution.

7. CODE OF CONDUCT

You agree to treat all tenants with respect regardless of their background, and to never engage in discriminatory, harassing, or abusive conduct toward any user of the Platform.

8. LEGAL CONSEQUENCES

Violation of this agreement — including posting false or misleading listings, submitting fraudulent documents, listing a property without the right to do so, or harassment — may result in immediate suspension, removal of listings, reporting to Papua New Guinea authorities, civil legal action, or criminal referral.

9. PLATFORM AUTHORITY

HausFindrr reserves the right to investigate complaints, remove any listing at any time, and suspend or permanently ban any landlord account found in violation of this agreement.

10. AGREEMENT TO TERMS

By completing this agreement, you confirm that you have read every section in full, you understand your obligations, and you agree to be bound by this Code of Conduct and Platform Policy. This agreement is effective immediately upon confirmation.`;

const STEPS = [
  { number: 1, label: 'Your Details' },
  { number: 2, label: 'Verify' },
  { number: 3, label: 'Agreement' },
  { number: 4, label: 'Wait for Review' },
];

function ProgressBar({ step }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-200 -z-0" />
        <div
          className="absolute left-0 top-4 h-0.5 bg-primary transition-all duration-500 -z-0"
          style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        {STEPS.map(s => (
          <div key={s.number} className="flex flex-col items-center z-10">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                s.number < step
                  ? 'bg-primary border-primary text-white'
                  : s.number === step
                  ? 'bg-white border-primary text-primary'
                  : 'bg-white border-gray-300 text-gray-400'
              }`}
            >
              {s.number < step ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : s.number}
            </div>
            <span className={`mt-1.5 text-xs font-medium whitespace-nowrap ${s.number === step ? 'text-primary' : 'text-gray-400'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FileUpload({ label, file, onChange, accept = '.pdf,.jpg,.jpeg,.png', hint = 'PDF, JPG, or PNG — max 10MB' }) {
  return (
    <div>
      <label className="label">{label}</label>
      <label className={`mt-1 flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${file ? 'border-secondary bg-secondary/5' : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}>
        <input type="file" className="hidden" accept={accept} onChange={onChange} />
        {file ? (
          <div className="text-center px-2">
            <svg className="w-7 h-7 text-secondary mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-secondary font-medium truncate max-w-xs">{file.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">Click to change</p>
          </div>
        ) : (
          <div className="text-center">
            <svg className="w-7 h-7 text-gray-300 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-500">Click to upload</p>
            <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
          </div>
        )}
      </label>
    </div>
  );
}

export default function LandlordRegister() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', id_type: 'passport' });
  const [idFile, setIdFile] = useState(null);
  const [rightToRentFile, setRightToRentFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [scrolledAgreement, setScrolledAgreement] = useState(false);
  const agreementRef = useRef(null);
  const { saveAuth } = useAuth();
  const navigate = useNavigate();

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleAgreementScroll = useCallback(() => {
    const el = agreementRef.current;
    if (!el || scrolledAgreement) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) setScrolledAgreement(true);
  }, [scrolledAgreement]);

  async function handleStep2Submit(e) {
    e.preventDefault();
    if (!idFile) return toast.error('Please upload your government ID');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('id_document', idFile);
      if (rightToRentFile) fd.append('right_to_rent', rightToRentFile);

      const { data } = await api.post('/auth/register/landlord', fd);
      saveAuth(data.token, data.user);
      setStep(3);
    } catch (err) {
      if (!err.response) {
        toast.error('Cannot reach the server. Please try again shortly.');
      } else {
        toast.error(err.response.data?.error || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleStep3Submit(e) {
    e.preventDefault();
    if (!agreedToTerms) return toast.error('You must accept the Landlord Agreement to continue.');
    setLoading(true);
    try {
      await api.patch('/auth/accept-terms');
      setStep(4);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to accept agreement. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 shadow-sm px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <Link to="/" className="text-2xl font-bold text-primary">HausFindrr</Link>
        </div>
      </header>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-primary mb-1">Become a Landlord</h1>
            <p className="text-gray-500 text-sm">List your rental properties on HausFindrr</p>
          </div>

          <ProgressBar step={step} />

          {/* Step 1: Your Details */}
          {step === 1 && (
            <form onSubmit={e => { e.preventDefault(); setStep(2); }} className="space-y-4">
              <GuideBox guideKey="landlordStep1" className="mb-1" />
              <div>
                <label className="label">Full Name</label>
                <input className="input" required placeholder="Your full legal name" value={form.name} onChange={set('name')} />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input className="input" type="tel" required placeholder="+675 xxx xxxx" value={form.phone} onChange={set('phone')} />
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-1.5">
                  Your phone number will be visible to signed-in tenants viewing your listings.
                </p>
              </div>
              <div>
                <label className="label">Email Address</label>
                <input className="input" type="email" required placeholder="you@example.com" value={form.email} onChange={set('email')} />
              </div>
              <div>
                <label className="label">Password</label>
                <input className="input" type="password" required minLength={8} placeholder="Min. 8 characters" value={form.password} onChange={set('password')} />
              </div>

              <button className="btn-primary w-full py-3 text-base mt-2" type="submit">
                Continue →
              </button>
            </form>
          )}

          {/* Step 2: Verify */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-5">
              <GuideBox guideKey="landlordStep2" />

              <div>
                <label className="label">ID Type</label>
                <select className="input" value={form.id_type} onChange={set('id_type')}>
                  {ID_TYPE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <FileUpload
                label={`Upload ${ID_TYPE_OPTIONS.find(o => o.value === form.id_type)?.label} *`}
                file={idFile}
                onChange={e => setIdFile(e.target.files[0])}
              />

              <FileUpload
                label="Proof of Right to Rent (optional)"
                file={rightToRentFile}
                onChange={e => setRightToRentFile(e.target.files[0])}
                hint="Lease, ownership deed, or written authority — PDF, JPG, PNG"
              />
              <p className="text-xs text-gray-500 -mt-2">
                If you are listing on behalf of a property owner, please upload written authority from the owner.
              </p>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
                  ← Back
                </button>
                <button className="flex-[2] btn-primary py-3 text-base" disabled={loading}>
                  {loading ? 'Creating account…' : 'Create Account →'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Landlord Agreement */}
          {step === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-4">
              <GuideBox guideKey="landlordStep3" />
              <p className="text-sm text-gray-600">
                Before you can add listings, you must read and accept the Landlord Agreement.
              </p>

              <div
                ref={agreementRef}
                onScroll={handleAgreementScroll}
                className="rounded-xl border overflow-y-scroll text-xs text-gray-700 leading-relaxed whitespace-pre-wrap p-4 font-mono"
                style={{ height: 'clamp(220px, 30vw, 280px)', borderColor: '#41271b', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
              >
                {AGREEMENT_TEXT}
              </div>

              <p className={`text-xs font-medium ${scrolledAgreement ? 'text-green-600' : 'text-secondary'}`}>
                {scrolledAgreement ? 'You have read the agreement ✓' : 'Scroll to the bottom to accept'}
              </p>

              <label className={`flex items-start gap-2.5 cursor-pointer select-none ${!scrolledAgreement ? 'opacity-40 pointer-events-none' : ''}`}>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={e => scrolledAgreement && setAgreedToTerms(e.target.checked)}
                  disabled={!scrolledAgreement}
                  className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0"
                />
                <span className="text-sm text-gray-700">
                  I have read and agree to the{' '}
                  <Link to="/landlord-agreement" target="_blank" rel="noopener noreferrer" className="text-secondary font-medium hover:underline" onClick={e => e.stopPropagation()}>
                    Landlord Agreement
                  </Link>
                  , as well as the{' '}
                  <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-secondary font-medium hover:underline" onClick={e => e.stopPropagation()}>
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-secondary font-medium hover:underline" onClick={e => e.stopPropagation()}>
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>

              <button
                className="btn-primary w-full py-3 text-base"
                disabled={loading || !agreedToTerms}
                style={!agreedToTerms ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
              >
                {loading ? 'Saving…' : 'Accept & Continue →'}
              </button>
            </form>
          )}

          {/* Step 4: Wait for Review */}
          {step === 4 && (
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Your account is under review</h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Thank you for registering on HausFindrr. Our team will review your documents and verify your account within <strong>1–2 business days</strong>.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm">
                <p className="font-semibold text-gray-700 mb-2">What happens next?</p>
                <div className="flex items-start gap-2 text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>We review your identity documents</span>
                </div>
                <div className="flex items-start gap-2 text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Your account status is updated to Approved or Declined</span>
                </div>
                <div className="flex items-start gap-2 text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Once approved, you can add your first listing</span>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Questions? Email{' '}
                <a href="mailto:info@hausfindrr.com" className="text-secondary hover:underline">info@hausfindrr.com</a>
              </p>
              <button
                onClick={() => navigate('/landlord/dashboard')}
                className="btn-primary w-full py-3 text-base"
              >
                Go to My Dashboard
              </button>
            </div>
          )}

          {step <= 2 && (
            <p className="text-center mt-5 text-sm text-gray-500">
              Already registered?{' '}
              <Link to="/landlord/login" className="text-secondary font-medium hover:underline">Sign in</Link>
            </p>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
