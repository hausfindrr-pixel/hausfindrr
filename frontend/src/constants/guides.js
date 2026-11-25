/**
 * Guide box copy — edit here to change all in-app help text.
 * Each key maps to a plain object { title?, body } used by the GuideBox component.
 */
const GUIDES = {
  // --- Landlord onboarding ---
  landlordStep1: {
    body: 'Your details are kept private. We use your phone number only if we need to contact you about your account — it is never shown to tenants.',
  },
  landlordStep2: {
    title: 'Why do we ask for ID?',
    body: 'We verify every landlord's identity before listings go live. This protects tenants from fraudulent listings. Documents are stored securely and are not shared with tenants.',
  },
  landlordStep3: {
    body: 'Please scroll through the full Landlord Agreement before ticking the checkbox. You can download or print it at any time from your dashboard.',
  },
  landlordStep4: {
    title: 'What happens next?',
    body: 'Our team reviews your documents within 1–2 business days. You will receive an email at the address you registered with once your account is approved.',
  },

  // --- Tenant browse ---
  tenantBrowse: {
    body: 'All listings shown are rental properties. Contact details are free — HausFindrr never charges tenants any fee.',
  },

  // --- Property detail ---
  propertyContact: {
    body: 'Contact the landlord directly. HausFindrr does not forward your details to them — reach out only if you are genuinely interested.',
  },
  propertyVerifiedBadge: {
    title: 'What does Verified mean?',
    body: 'HausFindrr has reviewed this landlord's government-issued ID. It does not confirm ownership of this specific property. Always view the property in person before signing or paying anything.',
  },

  // --- Admin ---
  adminPendingLandlords: {
    body: 'Review each landlord's submitted documents before approving. Use the decline reasons below for common issues — this helps landlords resubmit correctly.',
  },
  adminPendingListings: {
    body: 'Check listing details for accuracy and completeness. Listings go live immediately on approval.',
  },
};

export default GUIDES;
