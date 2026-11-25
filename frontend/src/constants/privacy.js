export const PRIVACY_VERSION = 'v1.0-july2026';
export const PRIVACY_EFFECTIVE_DATE = 'July 2026';

export const PRIVACY_SECTIONS = [
  {
    heading: '1. Introduction',
    body: `HausFindrr ("we", "us", "our") is committed to protecting your personal information. This Privacy Policy explains what data we collect, why we collect it, how we use it, and your rights in relation to it. By creating an account or using the HausFindrr platform, you agree to the collection and use of your information as described in this policy.`,
  },
  {
    heading: '2. Data We Collect',
    body: `We collect the following categories of personal data:

Registration data: your full name, email address, phone number, and password (stored as a secure hash).

Identity documents (landlords only): government-issued ID documents and property ownership documents uploaded during the verification process.

Usage data: pages viewed, search terms, listings saved, messages sent, and timestamps of activity.

Technical data: IP address, browser type and version, device type, and operating system, collected when you use the platform.

Consent records: a log of when you accepted our Terms of Service, Privacy Policy, and Landlord Agreement, including the date, time, and IP address of acceptance.`,
  },
  {
    heading: '3. How We Use Your Data',
    body: `We use your personal data to:

• Create and manage your account
• Verify landlord identity and property ownership
• Display landlord contact details (name and phone) to signed-in tenants
• Enable messaging between tenants and landlords through the platform
• Maintain an immutable audit log of your consent to our terms
• Investigate and resolve complaints or reports
• Improve and secure the platform
• Comply with applicable law

We do not use your data for advertising or marketing purposes, and we will never sell your personal data to third parties.`,
  },
  {
    heading: '4. What We Share',
    body: `When you are a verified landlord, your name and phone number are shown to signed-in tenants viewing your listings. This is the core service you have agreed to provide by listing a property on HausFindrr.

We do not automatically share your email address or any other personal details with other users.

We may share your personal data with:
• Our hosting and infrastructure providers (Vercel, Railway, Cloudinary) solely for the purpose of operating the platform
• Law enforcement or regulatory authorities where we are required by law to do so
• Professional advisors (legal, financial) under strict confidentiality obligations

We require all third-party processors to protect your data to at least the same standard as HausFindrr.`,
  },
  {
    heading: '5. Identity Documents',
    body: `Identity and ownership documents uploaded by landlords are stored securely using private cloud storage. These documents are:

• Accessible only to HausFindrr admin staff for verification purposes
• Accessed via secure signed URLs that expire after a short period
• Subject to a 30-day automatic deletion policy once the verification decision has been made, unless retained under a legal hold
• Never shared with tenants or other users

HausFindrr maintains a deletion log for all document removals.`,
  },
  {
    heading: '6. Consent Log',
    body: `When you accept our Terms of Service, Privacy Policy, or Landlord Agreement, we record:

• Your user ID and email address
• The document accepted and its version
• The date and time of acceptance
• Your IP address at the time
• Your browser and device information

These records are immutable — they are never edited or deleted, even if you close your account. This is required by law and by our own platform integrity policies.`,
  },
  {
    heading: '7. Data Retention',
    body: `We retain your personal data for as long as your account is active and for a reasonable period afterwards in case of disputes or legal requirements.

If you close your account, your profile data will be deleted or anonymised within 30 days. However, the following records will be retained indefinitely:
• Your consent log entries
• Any messages that form part of an ongoing dispute or legal matter
• Anonymised analytics data`,
  },
  {
    heading: '8. Your Rights',
    body: `You have the following rights regarding your personal data:

Access: you may request a copy of the personal data we hold about you.
Correction: you may request correction of inaccurate data.
Deletion: you may request deletion of your account and associated data, subject to legal retention requirements.
Data portability: you may request your data in a structured, machine-readable format.
Objection: you may object to certain types of processing.

To exercise any of these rights, please contact us at info@hausfindrr.com. We will respond within 30 days.`,
  },
  {
    heading: '9. Cookies and Tracking',
    body: `HausFindrr uses only strictly necessary session storage and local storage to keep you signed in and remember your preferences. We do not use advertising cookies, tracking pixels, or third-party analytics services that share your data with advertisers.`,
  },
  {
    heading: '10. Security',
    body: `We take the security of your personal data seriously. We use industry-standard measures including:
• Encrypted data transmission (HTTPS/TLS)
• Hashed and salted password storage
• Access controls limiting staff access to personal data
• Signed, time-limited URLs for sensitive documents

No system is completely secure. If you suspect your account has been compromised, contact us immediately at info@hausfindrr.com.`,
  },
  {
    heading: '11. Children',
    body: `HausFindrr is not directed at children under the age of 18. We do not knowingly collect personal data from anyone under 18. If you believe a child has registered, please contact us at info@hausfindrr.com and we will delete the account promptly.`,
  },
  {
    heading: '12. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email or through a prominent notice on the platform, and update the version identifier. Continued use of the platform after the effective date constitutes your acceptance of the revised policy.`,
  },
  {
    heading: '13. Contact Us',
    body: `If you have any questions, concerns, or requests relating to this Privacy Policy or your personal data, please contact us at:

HausFindrr
Email: info@hausfindrr.com
Platform: hausfindrr.com

We aim to respond to all data-related enquiries within 30 days.`,
  },
];
