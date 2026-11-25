const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DOCUMENT_VERSIONS = {
  terms_of_service:     'v1.0-july2026',
  privacy_policy:       'v1.0-july2026',
  landlord_agreement:   'v1.0-july2026',
  tenant_safety:        'v1.0-july2026',
};

function extractIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || 'unknown';
}

function extractUserAgent(req) {
  return (req.headers['user-agent'] || 'unknown').slice(0, 512);
}

async function logConsent(req, { userId, userEmail, userRole, document, version }) {
  try {
    await prisma.consentLog.create({
      data: {
        userId:    userId || null,
        userEmail,
        userRole,
        document,
        version:   version || DOCUMENT_VERSIONS[document] || 'v1.0',
        accepted:  true,
        ipAddress: extractIp(req),
        userAgent: extractUserAgent(req),
      },
    });
  } catch (err) {
    // Non-fatal — log but never block the main flow
    console.error('[consentService] failed to write consent log:', err.message);
  }
}

// Log the two sign-up consents (ToS + Privacy Policy) for a new user
async function logSignupConsents(req, user) {
  const base = { userId: user.id, userEmail: user.email, userRole: user.role };
  await Promise.all([
    logConsent(req, { ...base, document: 'terms_of_service',  version: DOCUMENT_VERSIONS.terms_of_service }),
    logConsent(req, { ...base, document: 'privacy_policy',    version: DOCUMENT_VERSIONS.privacy_policy }),
  ]);
}

// Log tenant safety acknowledgement (shown at sign-up or first browse)
async function logTenantSafetyConsent(req, user) {
  await logConsent(req, {
    userId: user.id, userEmail: user.email, userRole: user.role,
    document: 'tenant_safety', version: DOCUMENT_VERSIONS.tenant_safety,
  });
}

// Log landlord agreement acceptance (step 3 of onboarding)
async function logLandlordAgreementConsent(req, user) {
  await logConsent(req, {
    userId: user.id, userEmail: user.email, userRole: user.role,
    document: 'landlord_agreement', version: DOCUMENT_VERSIONS.landlord_agreement,
  });
}

module.exports = {
  logConsent,
  logSignupConsents,
  logTenantSafetyConsent,
  logLandlordAgreementConsent,
  DOCUMENT_VERSIONS,
};
