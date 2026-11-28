import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

// Set to something like "1–2 business days" or leave empty to omit timing copy
const REVIEW_TIME_TEXT = '';

export default function OnboardingNudge({ user, properties: propsProp = null }) {
  const [properties, setProperties] = useState(propsProp);
  const [firstListingAcked, setFirstListingAcked] = useState(false);

  useEffect(() => {
    try { setFirstListingAcked(localStorage.getItem('hf_first_listing_ack') === '1'); } catch {}
  }, []);

  useEffect(() => {
    if (propsProp !== null) { setProperties(propsProp); return; }
    if (user?.status !== 'active') return;
    api.get('/properties/my')
      .then(r => setProperties(r.data.properties || []))
      .catch(() => setProperties([]));
  }, [user?.status, propsProp]);

  if (!user) return null;
  const { status } = user;

  // Active + first listing live (one-time card)
  if (status === 'active' && properties !== null && properties.some(p => p.status === 'active') && !firstListingAcked) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 shadow-sm flex items-start gap-3">
        <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-green-800">Your first listing is live!</p>
          <p className="text-xs text-green-700 mt-0.5 leading-relaxed">Add 5 or more clear photos to get more enquiries from tenants.</p>
        </div>
        <button
          onClick={() => {
            try { localStorage.setItem('hf_first_listing_ack', '1'); } catch {}
            setFirstListingAcked(true);
          }}
          className="text-xs font-semibold text-green-700 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
        >
          Got it
        </button>
      </div>
    );
  }

  // Active + verified, no listings yet
  if (status === 'active' && properties !== null && !properties.some(p => p.status === 'active')) {
    return (
      <div className="bg-[#EDE0CE] border border-[#C8A887] rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-[#41271B]">You're Verified — time to list!</p>
        <p className="text-xs text-[#6B4A37] mt-1 leading-relaxed">Add your first property to reach tenants across PNG.</p>
        <Link
          to="/landlord/new-listing"
          className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-white bg-[#975536] hover:bg-[#41271B] px-4 py-2 rounded-xl transition-colors"
        >
          Add First Listing
        </Link>
      </div>
    );
  }

  // ID needed (revoked by admin)
  if (status === 'id_needed') {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-orange-800">We need your ID again</p>
        {user.revocationReason && (
          <p className="text-xs text-orange-700 mt-0.5 leading-relaxed">{user.revocationReason}</p>
        )}
        <Link to="/landlord/dashboard" className="inline-block mt-2 text-xs font-semibold text-orange-700 underline underline-offset-2">
          Upload your ID on Account →
        </Link>
      </div>
    );
  }

  // Rejected
  if (status === 'rejected') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-red-800">We couldn't verify your ID</p>
        {user.rejectionReason && (
          <p className="text-xs text-red-700 mt-0.5 leading-relaxed">{user.rejectionReason}</p>
        )}
        <Link to="/landlord/dashboard" className="inline-block mt-2 text-xs font-semibold text-red-700 underline underline-offset-2">
          Upload a new ID on Account →
        </Link>
      </div>
    );
  }

  // Under review (ID uploaded, awaiting verification)
  if (status === 'pending_verification' && user.profileComplete !== false) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-sm flex items-start gap-3">
        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-blue-800">Your ID is under review</p>
          <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
            We'll notify you as soon as it's processed{REVIEW_TIME_TEXT ? ` — usually ${REVIEW_TIME_TEXT}` : ''}.
          </p>
        </div>
      </div>
    );
  }

  // No ID uploaded yet
  if (status === 'pending_verification' && user.profileComplete === false) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-amber-800">Upload your ID to get Verified</p>
        <p className="text-xs text-amber-700 mt-1 leading-relaxed">
          Add your ID to start listing properties{REVIEW_TIME_TEXT ? ` — review usually takes ${REVIEW_TIME_TEXT}` : ''}.
        </p>
        <Link to="/landlord/dashboard" className="inline-block mt-2 text-xs font-semibold text-amber-700 underline underline-offset-2">
          Go to Account to upload →
        </Link>
      </div>
    );
  }

  return null;
}
