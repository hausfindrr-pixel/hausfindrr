import { Link } from 'react-router-dom';
import Footer from '../components/shared/Footer';

const AGREEMENT_VERSION = 'v1.0';
const AGREEMENT_EFFECTIVE_DATE = 'July 2026';

const SECTIONS = [
  {
    heading: '1. Who This Agreement Applies To',
    body: `This agreement applies to any person or entity ("Landlord") who registers on HausFindrr with the intention of listing residential or commercial properties for rent. By completing the sign-up process and ticking the confirmation box, you enter into this legally binding agreement with HausFindrr.`,
  },
  {
    heading: '2. Listing Accuracy',
    body: `All information in your property listings — including price, location, photographs, amenities, and availability — must be accurate and current at all times. You must update or remove any listing that is no longer available. Posting misleading, false, or duplicate listings is a serious violation of this agreement.`,
  },
  {
    heading: '3. Rented Status Obligation',
    body: `You are required to mark your listing as "Rented" as soon as a tenant has agreed to rent your property. Leaving an unavailable property listed as active misleads other tenants who are searching in good faith. This is considered deceptive conduct and a direct violation of this agreement.`,
  },
  {
    heading: '4. Landlord Identity Verification',
    body: `You must submit a valid government-issued identity document as part of your registration. HausFindrr will review this document as part of the verification process. You confirm that all documents submitted are genuine and belong to you. Submitting false or fraudulent documents is a criminal offence under Papua New Guinea law.`,
  },
  {
    heading: '5. Right to List',
    body: `By listing a property on HausFindrr, you confirm that:
• You are the legal owner of the property, or
• You have the owner's written authority to list and rent the property on their behalf, and
• You have the right to enter into a rental agreement in respect of that property.

Listing a property without the right to do so is fraud and may result in criminal prosecution.`,
  },
  {
    heading: '6. Contact Details & Tenant Communication',
    body: `Your name and phone number will be visible to signed-in tenants viewing your listings. You agree to:
• Use these details for genuine rental enquiries only
• Respond professionally and honestly to all tenant enquiries
• Never request payments or deposits before a tenant has viewed the property in person and signed a written agreement`,
  },
  {
    heading: '7. Code of Conduct',
    body: `You agree to treat all tenants with respect regardless of their background, and to never engage in discriminatory, harassing, or abusive conduct toward any user of the Platform.`,
  },
  {
    heading: '8. Legal Consequences',
    body: `Violation of this agreement — including but not limited to:
• Posting false, misleading, or fraudulent listings
• Submitting fraudulent identity or ownership documents
• Listing a property without the right to do so
• Harassment or misconduct toward tenants or HausFindrr staff

...may result in:
• Immediate suspension or permanent removal of your HausFindrr account
• Removal of all your listings without notice
• Reporting to relevant Papua New Guinea authorities
• Civil legal action
• Criminal referral where applicable under Papua New Guinea law`,
  },
  {
    heading: '9. Platform Authority',
    body: `HausFindrr reserves the right to:
• Investigate all complaints made against landlords
• Remove any listing at any time without prior notice
• Suspend or permanently ban any landlord account found in violation of this agreement
• Share landlord information with law enforcement if required`,
  },
  {
    heading: '10. Agreement to Terms',
    body: `By completing this agreement, you confirm that:
• You have read every section of this document in full
• You understand your obligations as a landlord on HausFindrr
• You agree to be bound by this Code of Conduct and Platform Policy
• You understand that violation may result in account suspension and legal action under Papua New Guinea law

This agreement is effective immediately upon confirmation and applies for the duration of your use of the HausFindrr platform.`,
  },
];

export default function LandlordAgreementPage() {
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
          <Link to="/" className="text-sm font-medium hover:underline" style={{ color: '#975536' }}>
            ← Back
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Landlord Agreement</h1>
          <p className="text-sm text-gray-400">
            HausFindrr · {AGREEMENT_VERSION} · Effective {AGREEMENT_EFFECTIVE_DATE}
          </p>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            This agreement applies to all landlords who register on HausFindrr and must be accepted before listing a property.
          </p>
        </div>

        <div className="space-y-8">
          {SECTIONS.map((section, i) => (
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
            <Link to="/privacy" className="text-sm font-medium hover:underline" style={{ color: '#975536' }}>
              Privacy Policy
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
