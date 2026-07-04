export const TOS_VERSION = 'v1.0-july2026';

export const TOS_SECTIONS = [
  {
    heading: '1. Introduction',
    body: `Welcome to HausFindrr, PNG's online property marketplace ("Platform"). By registering as a tenant, you agree to be bound by these Terms of Service ("Terms"). Please read them carefully. If you do not agree, you may not create an account or use the Platform.`,
  },
  {
    heading: '2. Role of HausFindrr',
    body: `HausFindrr is a technology platform that connects tenants seeking residential and commercial properties with landlords who list those properties. HausFindrr is not a real estate agent, property manager, or party to any rental or sale agreement. We do not own, manage, control, or inspect any listed property. All agreements for the rental or purchase of property are solely between the tenant and the landlord.`,
  },
  {
    heading: '3. Eligibility',
    body: `You must be at least 18 years of age to create a tenant account on HausFindrr. By registering, you confirm that you meet this requirement and that all information you provide is accurate, truthful, and current. HausFindrr reserves the right to suspend or terminate any account where we have reason to believe eligibility requirements are not met.`,
  },
  {
    heading: '4. Account Registration',
    body: `When you register, you must provide your full legal name, a valid email address, a current phone number, and a secure password. You are responsible for maintaining the confidentiality of your password and for all activity that occurs under your account. You must notify HausFindrr immediately at support@hausfindrr.com if you suspect unauthorised access to your account. HausFindrr will not be liable for any loss arising from your failure to keep your credentials secure.`,
  },
  {
    heading: '5. Landlord Obligations',
    body: `While these Terms apply to tenants, please be aware that landlords on HausFindrr are required to submit valid identity documents and comply with separate landlord terms. Landlords must ensure all listing details — including property descriptions, pricing, photographs, and ownership documents — are accurate and lawful. HausFindrr reviews listings before they go live but does not guarantee the accuracy or completeness of any listing. You should conduct your own due diligence before entering into any property agreement.`,
  },
  {
    heading: '6. Unlock Fee',
    body: `To view the full details of a property listing — including the exact address and the landlord's direct contact information — tenants pay a one-time, non-refundable Unlock Fee of K25 per listing. Payment of the Unlock Fee grants you personal, non-transferable access to that listing's confidential details. You may not share, resell, or distribute unlocked listing details to any third party. Fees are processed securely and are not refundable except where required by applicable law.`,
  },
  {
    heading: '7. Prohibited Conduct',
    body: `You agree not to use the Platform to:
• Misrepresent your identity or create false accounts
• Contact landlords for purposes other than genuine property enquiries
• Scrape, harvest, or collect data from the Platform without authorisation
• Share unlocked listing details with third parties
• Post or transmit any harassing, abusive, defamatory, or unlawful content
• Attempt to circumvent any security measure or access controls
• Use automated bots, scripts, or tools to interact with the Platform
• Engage in any activity that interferes with the proper functioning of the Platform

Violation of these rules may result in immediate account suspension and/or legal action.`,
  },
  {
    heading: '8. Disclaimer of Liability',
    body: `HausFindrr provides the Platform on an "as is" and "as available" basis. To the maximum extent permitted by law, HausFindrr disclaims all warranties, express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.

HausFindrr does not verify the accuracy of listing descriptions, photographs, or landlord-provided documents beyond the identity verification process. We are not responsible for any loss, damage, or disappointment arising from your reliance on listing information or from any agreement made between you and a landlord.

In no event shall HausFindrr's total liability to you exceed the amount of the Unlock Fee paid by you in respect of the specific listing that gave rise to the claim.`,
  },
  {
    heading: '9. Intellectual Property',
    body: `All content on the Platform — including the HausFindrr name, logo, design, text, and software — is the property of HausFindrr or its licensors and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works from any Platform content without our prior written consent. By submitting content to the Platform (such as reviews or messages), you grant HausFindrr a non-exclusive, royalty-free licence to use that content in connection with operating the Platform.`,
  },
  {
    heading: '10. Account Suspension & Termination',
    body: `HausFindrr reserves the right to suspend or permanently terminate your account at any time, with or without notice, if we reasonably believe you have violated these Terms, engaged in fraudulent activity, or otherwise misused the Platform. You may also close your account at any time by contacting support@hausfindrr.com. Upon termination, your access to the Platform and any unlocked listing details will cease. Unlock Fees already paid are non-refundable.`,
  },
  {
    heading: '11. Dispute Resolution',
    body: `If you have a dispute with a landlord or another user, we encourage you to contact HausFindrr support at support@hausfindrr.com. We will endeavour to assist in resolving disputes on a goodwill basis, but we are under no obligation to mediate or resolve disputes between users. Any dispute between you and HausFindrr that cannot be resolved informally shall be submitted to binding arbitration under the laws of Papua New Guinea, unless otherwise required by applicable mandatory law.`,
  },
  {
    heading: '12. Governing Law',
    body: `These Terms are governed by and construed in accordance with the laws of Papua New Guinea, without regard to its conflict of law principles. You irrevocably submit to the exclusive jurisdiction of the courts of Papua New Guinea for any dispute arising under or in connection with these Terms, to the extent that such disputes are not resolved by arbitration.`,
  },
  {
    heading: '13. Changes to These Terms',
    body: `HausFindrr may update these Terms from time to time to reflect changes in our practices, legal requirements, or platform features. When we make material changes, we will notify you by email or through a prominent notice on the Platform, and update the "Terms Version" identifier. Continued use of the Platform after the effective date of any changes constitutes your acceptance of the revised Terms.`,
  },
  {
    heading: '14. Contact Us',
    body: `If you have any questions about these Terms, please contact us at:

HausFindrr Support
Email: support@hausfindrr.com
Platform: hausfindrr.com

We aim to respond to all enquiries within 2 business days.`,
  },
  {
    heading: '15. Tenant Acknowledgement',
    body: `By ticking the "I Agree" checkbox and creating your account, you confirm that:

• You have read and understood these Terms of Service in full
• You are at least 18 years of age
• All registration information you have provided is accurate and truthful
• You agree to be bound by these Terms and any future updates notified to you
• You understand that the K25 Unlock Fee is non-refundable
• You will use the Platform solely for legitimate property-seeking purposes

These Terms were last updated in July 2026 (Version ${TOS_VERSION}).`,
  },
];

export const TOS_FULL_TEXT = TOS_SECTIONS
  .map(s => `${s.heading}\n\n${s.body}`)
  .join('\n\n---\n\n');
