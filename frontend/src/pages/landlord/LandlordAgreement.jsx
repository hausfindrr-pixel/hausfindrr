import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AGREEMENT_TEXT = `HAUSFINDRR LANDLORD AGREEMENT
Code of Conduct & Platform Policy

Welcome to HausFindrr. Before you can list properties or access your dashboard, you must read and agree to the following terms in full.

1. OCCUPIED STATUS OBLIGATION

You are required to mark your listing as "Occupied" immediately once a tenant has moved into your property. Failure to do so — leaving an unavailable property listed as active — causes tenants to pay the K25 unlock fee for a property that is no longer accessible. This is considered deceptive conduct and a direct violation of this agreement.

2. LISTING ACCURACY

All information in your property listings (price, location, photos, amenities, availability) must be accurate and current at all times. You must update or remove listings that are no longer available. Misleading or false listings are a serious violation of this agreement.

3. CODE OF CONDUCT

You agree to:
  • Communicate professionally and honestly with all tenants who contact you through HausFindrr
  • Never request payments or deposits outside the HausFindrr platform
  • Never post duplicate, fake, or misleading listings
  • Treat all tenants with respect regardless of their background

4. TENANT PROTECTION

HausFindrr tenants pay a K25 unlock fee to access your contact details in good faith. You have a direct obligation to be responsive and available when a tenant unlocks your listing. Repeatedly ignoring tenant inquiries after being unlocked is a violation of this agreement.

5. LEGAL CONSEQUENCES

Violation of this agreement — including but not limited to:
  • Failure to mark occupied properties as Occupied
  • Posting false or misleading listings
  • Defrauding tenants who have paid the unlock fee
  • Harassment or misconduct toward tenants

...may result in:
  • Immediate suspension or permanent removal of your HausFindrr account
  • Removal of all your listings without refund or notice
  • Reporting to relevant Papua New Guinea authorities
  • Civil legal action for damages caused to tenants who unlocked your listing in good faith
  • Criminal referral where applicable under Papua New Guinea law

6. PLATFORM AUTHORITY

HausFindrr reserves the right to:
  • Investigate all complaints made against landlords
  • Remove any listing at any time without prior notice
  • Suspend or permanently ban any landlord account found in violation of this agreement
  • Share landlord information with law enforcement if required

7. AGREEMENT TO TERMS

By completing this agreement, you confirm that:
  • You have read every section of this document in full
  • You understand your obligations as a landlord on HausFindrr
  • You agree to be bound by this Code of Conduct and Platform Policy
  • You understand that violation may result in legal action under Papua New Guinea law

This agreement is effective immediately upon confirmation and applies for the duration of your use of the HausFindrr platform.

HausFindrr — Connecting Papua New Guineans to their next home.`;

export default function LandlordAgreement() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // If already accepted, skip straight to dashboard
  useEffect(() => {
    if (user?.termsAccepted) navigate('/landlord/dashboard', { replace: true });
  }, [user]);

  // Check on mount whether the content is already short enough to be fully visible
  useEffect(() => {
    checkBottom();
  }, []);

  function checkBottom() {
    const el = scrollRef.current;
    if (!el) return;
    // Consider "at bottom" if within 8px — handles sub-pixel rounding on mobile
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 8) {
      setScrolledToBottom(true);
    }
  }

  async function handleConfirm() {
    if (!checked || !scrolledToBottom) return;
    setSubmitting(true);
    try {
      const { data } = await api.patch('/auth/accept-terms');
      // Update AuthContext + localStorage with the server-confirmed user
      await refreshUser();
      toast.success('Agreement confirmed. Welcome to HausFindrr!');
      navigate('/landlord/dashboard', { replace: true });
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Minimal locked header — no nav links */}
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 py-4 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="HausFindrr" className="w-8 h-8" />
          <span className="text-xl font-bold text-primary tracking-tight">HausFindrr</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start px-4 py-8">
        <div className="w-full max-w-2xl">

          {/* Title block */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Landlord Agreement</h1>
            <p className="text-sm text-gray-500 mt-1">
              Read the full agreement below before you can access your dashboard.
            </p>
          </div>

          {/* Scrollable agreement box */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
            {/* Scroll hint banner — shown until scrolled to bottom */}
            {!scrolledToBottom && (
              <div className="bg-amber-50 border-b border-amber-100 px-4 py-2.5 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <p className="text-xs text-amber-700 font-medium">Scroll to the bottom to enable the checkbox</p>
              </div>
            )}
            {scrolledToBottom && (
              <div className="bg-green-50 border-b border-green-100 px-4 py-2.5 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-xs text-green-700 font-medium">You've read the full agreement — you can now confirm below</p>
              </div>
            )}

            {/* Agreement text */}
            <div
              ref={scrollRef}
              onScroll={checkBottom}
              className="overflow-y-auto p-6"
              style={{ maxHeight: '55vh' }}
            >
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                {AGREEMENT_TEXT}
              </pre>
            </div>
          </div>

          {/* Confirmation controls */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            {/* Checkbox */}
            <label
              className={`flex items-start gap-3 cursor-pointer select-none ${!scrolledToBottom ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!scrolledToBottom}
                  onChange={e => setChecked(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    checked
                      ? 'bg-primary border-primary'
                      : scrolledToBottom
                        ? 'border-gray-300 bg-white hover:border-primary'
                        : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {checked && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-gray-700 leading-snug">
                I have read and understood the full HausFindrr Landlord Agreement and I agree to be bound by its terms. I understand that violation may result in account suspension and legal action under Papua New Guinea law.
              </span>
            </label>

            {/* Confirm button */}
            <button
              onClick={handleConfirm}
              disabled={!scrolledToBottom || !checked || submitting}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                scrolledToBottom && checked && !submitting
                  ? 'bg-primary text-white hover:bg-primary/90 shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Saving…' : 'I Agree — Continue to Dashboard'}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Your confirmation will be recorded along with the date, time, and your IP address.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
