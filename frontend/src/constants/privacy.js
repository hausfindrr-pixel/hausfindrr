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

Registration data. Your full name, email address, phone number, and password (stored as a secure hash).

Listing details (landlords). The address, description, photographs, price, and other details you enter when creating a property listing, and the name you choose to show on the listing.

Messages and reports. The messages you send and receive through HausFindrr, and reports you make about a listing, a conversation or a user.

Identity documents (landlords only). Government-issued ID documents and property ownership documents uploaded during the verification process.

Technical information. IP address, browser type and version, device type, and operating system, collected when you use the platform. We also count how many times a listing is viewed and how many conversations are started about it, so landlords can see how their listing is doing. Landlords see only totals, never the names of the people who looked.

Consent records. A log of when you accepted our Terms of Service, Privacy Policy, and Landlord Agreement, including the date, time, and IP address of acceptance.`,
  },
  {
    heading: '3. How We Use Your Data',
    body: `We use your personal data:

• to create and manage your account;
• to verify landlord identity and property ownership;
• to let registered tenants message landlords through HausFindrr, and landlords reply;
• to send you email alerts about new messages and replies, and important notices about HausFindrr;
• to maintain an immutable audit log of your consent to our terms;
• to investigate and resolve complaints or reports;
• to improve and secure the platform; and
• to comply with applicable law.

We do not use your data for advertising or marketing purposes, and we will never sell your personal data to third parties.`,
  },
  {
    heading: '4. What We Share',
    body: `Other users. When you are a verified landlord, your name and listing pin are visible to registered users on HausFindrr. Your phone number is not shown on your listing or profile. If you choose to share your phone number during a conversation with a tenant, that is your decision — HausFindrr will not share it automatically.

Tenants' personal details are not shown to landlords or other users.

Messages. Messages are private between the two parties in a conversation. HausFindrr staff do not read messages except when a conversation has been reported or is under active investigation, and every such access is logged.

Service providers. We work with Vercel (website hosting), Railway (servers and database), Cloudinary (storage of photos and verification documents), Google (maps) and Gmail (sending email alerts). We require all processors to protect your data to at least the same standard as HausFindrr.

We may also share your personal data with law enforcement or regulatory authorities where required by law, or with professional advisors under strict confidentiality obligations.`,
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

If you close your account, your profile data will be deleted or anonymised within 30 days. However, the following records will be retained:

Account and listing data. Deleted or anonymised within 30 days of account closure.

Messages. Kept while your account is open. Deleted within 90 days of account closure, except for any conversation that has been reported or is subject to a legal hold, which will be retained until the matter is resolved.

Consent log entries. Retained indefinitely as required by law.

Anonymised analytics. Retained indefinitely in aggregate, non-identifiable form.`,
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
    heading: '9. Push Notifications',
    body: `If you choose to enable push notifications, we store a push subscription token (issued by your browser or device) linked to your account. This token is used only to deliver notifications from HausFindrr — such as new messages, ID verification updates, and listing approvals — and is never shared with third parties.

You can disable push notifications at any time from your browser or device settings, or from Notification Settings in the app. We delete your push subscription token automatically if it becomes invalid or when your account is deleted.`,
  },
  {
    heading: '10. Cookies and Tracking',
    body: `HausFindrr uses only strictly necessary session storage and local storage to keep you signed in and remember your preferences. We do not use advertising cookies, tracking pixels, or third-party analytics services that share your data with advertisers.`,
  },
  {
    heading: '11. Security',
    body: `We take the security of your personal data seriously. We use industry-standard measures including:
• Encrypted data transmission (HTTPS/TLS)
• Hashed and salted password storage
• Access controls limiting staff access to personal data
• Signed, time-limited URLs for sensitive documents

No system is completely secure. If you suspect your account has been compromised, contact us immediately at info@hausfindrr.com.`,
  },
  {
    heading: '12. Children',
    body: `HausFindrr is not directed at children under the age of 18. We do not knowingly collect personal data from anyone under 18. If you believe a child has registered, please contact us at info@hausfindrr.com and we will delete the account promptly.`,
  },
  {
    heading: '13. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email or through a prominent notice on the platform, and update the version identifier. Continued use of the platform after the effective date constitutes your acceptance of the revised policy.`,
  },
  {
    heading: '13a. Account Setup Reminders',
    body: `If you are a landlord, HausFindrr may send you periodic reminders to help you complete your account setup — for example, to upload your identity document or to add your first property listing. These reminders are sent as push notifications and in-app alerts at most once per day, within reasonable hours (7 am – 9 pm Port Moresby time), and stop automatically once you have completed the relevant step or after a maximum of three reminders per stage.

You can turn off account setup reminders at any time in your Notification Settings. Turning them off does not affect other notification types.`,
  },
  {
    heading: '14. Contact Us',
    body: `If you have any questions, concerns, or requests relating to this Privacy Policy or your personal data, please contact us at:

HausFindrr
Email: info@hausfindrr.com
Platform: hausfindrr.com

We aim to respond to all data-related enquiries within 30 days.`,
  },
];
