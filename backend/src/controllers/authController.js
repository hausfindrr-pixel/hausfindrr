const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logSignupConsents, logLandlordAgreementConsent } = require('../services/consentService');
const { notify, notifyAdmin } = require('../services/notificationService');

// Normalise + validate an email address
function normaliseEmail(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().toLowerCase();
  return validator.isEmail(trimmed) ? trimmed : null;
}

// Normalise a PNG mobile number to +675XXXXXXXX (8 digits after country code).
// Accepts: 70000000, 7000 0000, +675 70000000, 675 70000000.
// Returns the normalised string on success, or null on failure.
function normalisePngPhone(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let s = raw.replace(/[\s\-().]/g, '');
  if (/[a-zA-Z]/.test(s)) return null;
  if (s.startsWith('+675')) s = s.slice(4);
  else if (s.startsWith('675')) s = s.slice(3);
  if (!/^\d{8}$/.test(s)) return null;
  return '+675' + s;
}

// Generate a unique landlord account code: HL-XXXXX
async function generateAccountCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 20; attempt++) {
    let code = 'HL-';
    for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
    const exists = await prisma.user.findFirst({ where: { accountCode: code } });
    if (!exists) return code;
  }
  throw new Error('Could not generate unique account code');
}

const WELCOME_NOTIFICATIONS = {
  landlord: [
    {
      type: 'welcome',
      title: 'Welcome to HausFindrr!',
      content: 'Welcome to HausFindrr, the fastest-growing property platform in PNG! Your account is under review — our team will verify your identity within 1–2 business days. Once approved, you can start listing your properties and connecting with tenants.',
    },
    {
      type: 'privacy_policy',
      title: 'Our Privacy Policy',
      content: 'By using HausFindrr, you agree to our Privacy Policy. We collect your name, contact details, and identity documents solely to verify your account and facilitate property listings. Your personal data is never sold to third parties. You can request deletion of your account at any time by contacting info@hausfindrr.com.',
    },
    {
      type: 'terms',
      title: 'Terms of Service',
      content: 'By registering as a landlord on HausFindrr, you agree to our Terms of Service. You are responsible for ensuring all listing information is accurate, that you have legal authority to list the property, and that you respond to tenant enquiries in good faith. HausFindrr reserves the right to suspend accounts that violate these terms.',
    },
  ],
  tenant: [
    {
      type: 'welcome',
      title: 'Welcome to HausFindrr!',
      content: 'Welcome to HausFindrr! You can now browse rental listings across PNG. Sign in to view the landlord\'s contact details and save your favourites. Happy house hunting!',
    },
    {
      type: 'privacy_policy',
      title: 'Our Privacy Policy',
      content: 'By using HausFindrr, you agree to our Privacy Policy. We collect your name and contact details to facilitate connections between tenants and landlords. Your personal data is never sold to third parties. You can request deletion of your account at any time by contacting info@hausfindrr.com.',
    },
    {
      type: 'terms',
      title: 'Terms of Service',
      content: 'By registering as a tenant on HausFindrr, you agree to our Terms of Service. You agree to use the platform honestly, not to misrepresent yourself to landlords, and to use landlord contact details for legitimate housing enquiries only. HausFindrr reserves the right to suspend accounts that violate these terms.',
    },
  ],
};

async function createWelcomeNotifications(userId, role) {
  const templates = WELCOME_NOTIFICATIONS[role] || [];
  if (templates.length === 0) return;
  await prisma.userNotification.createMany({
    data: templates.map(t => ({ userId, ...t })),
  });
}

const WELCOME_MESSAGE_CONTENT = {
  tenant: `Welcome to HausFindrr — PNG's rental property marketplace!

You can now browse rental listings across the country. Once you sign in, you'll see the landlord's name and phone number directly on each listing so you can contact them yourself.

A few tips to get started:
• Browse listings from the homepage
• View the landlord's contact details on any listing
• Save favourites with the heart icon
• Contact the landlord directly by phone

Happy house hunting! If you ever need help, reply to this message or email us at info@hausfindrr.com.

— The HausFindrr Team`,

  landlord: `Welcome to HausFindrr — PNG's fastest-growing property platform!

Your account has been created and is currently under review. Our admin team will verify your identity and uploaded documents within 1–2 business days.

What happens next:
• We'll review your ID document and account details
• Once approved, you'll be able to post property listings
• Tenants will be able to view your contact details and reach out directly

To speed up verification, make sure your ID document is uploaded clearly in your account. Listings you submit will be reviewed by our team before going live — this keeps the platform safe and trustworthy for everyone.

Questions? Reply to this message or email info@hausfindrr.com.

— The HausFindrr Team`,
};

async function sendWelcomeMessages(userId, role) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return;
    const admin = await prisma.user.findFirst({ where: { email: adminEmail.toLowerCase(), role: 'admin' } });
    if (!admin) return;
    const content = WELCOME_MESSAGE_CONTENT[role];
    if (!content) return;
    await prisma.message.create({
      data: { propertyId: null, senderId: admin.id, receiverId: userId, content },
    });
  } catch (err) {
    // Non-fatal — log but don't block registration
    console.error('[sendWelcomeMessages] failed:', err.message);
  }
}

// Enforce safe length limits on text fields
function clamp(val, max = 255) {
  return typeof val === 'string' ? val.slice(0, max) : val;
}

function signToken(user, rememberMe = false) {
  const expiresIn = rememberMe ? '30d' : (process.env.JWT_EXPIRES_IN || '7d');
  return jwt.sign(
    { id: user.id, role: user.role, status: user.status },
    process.env.JWT_SECRET,
    { expiresIn }
  );
}

function signTempToken(userId) {
  return jwt.sign(
    { id: userId, type: '2fa_pending' },
    process.env.JWT_SECRET,
    { expiresIn: '5m' }
  );
}

async function registerLandlord(req, res, next) {
  try {
    const { name, phone, campaign } = req.body;
    const password = req.body.password;
    const email = normaliseEmail(req.body.email);

    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required' });
    if (!phone || !phone.trim())
      return res.status(400).json({ error: 'Phone number is required' });
    if (!validator.isEmail(email))
      return res.status(400).json({ error: 'Invalid email address' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const normalisedPhone = normalisePngPhone(phone);
    if (!normalisedPhone)
      return res.status(400).json({ error: 'Please enter a valid PNG mobile number (e.g. 70000000)' });

    const safeName  = clamp(name, 100);
    const safePhone = normalisedPhone;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || 'unknown';
    const passwordHash = await bcrypt.hash(password, 12);
    const accountCode = await generateAccountCode();
    const user = await prisma.user.create({
      data: {
        name: safeName,
        phone: safePhone,
        email,
        passwordHash,
        role: 'landlord',
        status: 'pending_verification',
        accountCode,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        termsAcceptedIp: ip,
        termsVersion: 'v1.0-july2026',
      },
    });

    await createWelcomeNotifications(user.id, 'landlord');
    await sendWelcomeMessages(user.id, 'landlord');
    await logSignupConsents(req, user);
    await logLandlordAgreementConsent(req, user);

    // Funnel tracking (non-fatal)
    try {
      const safeCampaign = typeof campaign === 'string' ? campaign.slice(0, 100) : null;
      await prisma.funnelEvent.create({ data: { event: 'account_created', campaign: safeCampaign || null } });
    } catch {}

    // "Add your ID" nudge notification
    notify(user.id, {
      type:  'id_add_prompt',
      title: 'Add your ID to get Verified',
      body:  'Upload your passport or driver\'s licence to get verified and publish listings. Your ID is private and deleted after 30 days.',
      link:  '/landlord/dashboard',
    });

    // Notify admin of new pending landlord when they upload their first ID (not yet, so skip here)

    const token = signToken(user);
    res.status(201).json({ token, user: { ...safeUser(user), profileComplete: false } });
  } catch (err) {
    next(err);
  }
}

async function registerTenant(req, res, next) {
  try {
    const { name, phone } = req.body;
    const password = req.body.password;
    const email = normaliseEmail(req.body.email);

    if (!name || !phone || !email || !password)
      return res.status(400).json({ error: 'All fields required' });
    if (!validator.isEmail(email))
      return res.status(400).json({ error: 'Invalid email address' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const safeName  = clamp(name, 100);
    const safePhone = clamp(phone, 30);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || 'unknown';
    const user = await prisma.user.create({
      data: {
        name: safeName, phone: safePhone, email, passwordHash,
        role: 'tenant', status: 'active',
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        termsAcceptedIp: ip,
        termsVersion: 'v1.0-july2026',
      },
    });

    await createWelcomeNotifications(user.id, 'tenant');
    await sendWelcomeMessages(user.id, 'tenant');
    await logSignupConsents(req, user);

    const token = signToken(user);
    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { role } = req.body;
    const password = req.body.password;
    const email = normaliseEmail(req.body.email);
    const rememberMe = req.body.rememberMe === true;

    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ error: 'Invalid credentials' });

    if (role && user.role !== role)
      return res.status(403).json({ error: `This account is not registered as a ${role}` });

    // Admin with 2FA enabled: issue a short-lived temp token instead of full access
    if (user.role === 'admin' && user.twoFactorEnabled) {
      return res.json({ requiresTwoFactor: true, tempToken: signTempToken(user.id) });
    }

    const token = signToken(user, rememberMe);
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Compute profileComplete without using include — a separate count is more
    // resilient to stale Prisma clients and avoids a JOIN on the hot path.
    let profileComplete = !!user.phone;
    if (user.role === 'landlord') {
      try {
        const docCount = await prisma.landlordIdDocument.count({ where: { userId: user.id } });
        profileComplete = profileComplete && docCount > 0;
      } catch {
        // If the count fails, leave profileComplete as false for landlords
        profileComplete = false;
      }
    }

    res.json({ user: { ...safeUser(user), profileComplete } });
  } catch (err) {
    console.error('[me] error for user', req.user?.id, ':', err.message);
    next(err);
  }
}

async function completeProfile(req, res, next) {
  try {
    const { phone, id_type } = req.body;
    const files = req.files || {};
    const idFiles = files['id_document'] || [];

    if (phone && phone.trim()) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { phone: clamp(phone.trim(), 30) },
      });
    }

    if (req.user.role === 'landlord' && idFiles.length > 0) {
      const docType = normaliseIdDocType(id_type);
      const docExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await prisma.landlordIdDocument.createMany({
        data: idFiles.map(f => ({
          userId: req.user.id,
          docType,
          filePath: f.path,
          publicId: f.filename || null,
          expiresAt: docExpiry,
        })),
      });
      // Funnel tracking (non-fatal)
      try {
        await prisma.funnelEvent.create({ data: { event: 'id_uploaded', campaign: null } });
      } catch {}

      // Reset rejection state if landlord is re-uploading after a rejection
      await prisma.user.updateMany({
        where: { id: req.user.id, status: 'rejected' },
        data: { status: 'pending_verification', rejectionReason: null },
      });

      // Notify landlord: ID is under review
      notify(req.user.id, {
        type:  'id_received',
        title: 'ID received — under review',
        body:  'We\'ve received your ID document and will verify it within 1–2 business days.',
        link:  '/landlord/dashboard',
      });

      // Notify admin: new landlord awaiting verification
      notifyAdmin('admin_pending_landlord', 'New landlord waiting for ID verification', 'A landlord has uploaded their ID and is waiting for review.', '/admin');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { landlordIdDocuments: { select: { id: true } } },
    });
    const profileComplete =
      !!user.phone && (user.role !== 'landlord' || user.landlordIdDocuments.length > 0);
    const { passwordHash, landlordIdDocuments, ...safeFields } = user;
    res.json({ user: { ...safeFields, profileComplete } });
  } catch (err) {
    next(err);
  }
}

async function acceptTerms(req, res, next) {
  try {
    if (req.user.role !== 'landlord')
      return res.status(403).json({ error: 'Only landlords accept this agreement' });

    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || 'unknown';

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        termsAcceptedIp: ip,
      },
    });

    console.log(`[TERMS] Landlord ${user.id} (${user.email}) accepted terms at ${new Date().toISOString()} from IP ${ip}`);
    await logLandlordAgreementConsent(req, user);
    res.json({ user: safeUser(user) });
  } catch (err) {
    next(err);
  }
}

function safeUser(u) {
  const { passwordHash, ...rest } = u;
  return rest;
}

function normaliseIdDocType(idType) {
  if (idType === 'nid') return 'nid';
  if (idType === 'drivers_licence') return 'drivers_licence';
  return 'passport';
}

async function updateProfile(req, res, next) {
  try {
    const { name, phone } = req.body;
    if (!name?.trim() || !phone?.trim())
      return res.status(400).json({ error: 'Name and phone are required' });
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name: clamp(name.trim(), 100), phone: clamp(phone.trim(), 30) },
    });
    res.json({ user: safeUser(user) });
  } catch (err) { next(err); }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'Both passwords required' });
    if (newPassword.length < 8)
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.passwordHash)
      return res.status(400).json({ error: 'No password set for this account' });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid)
      return res.status(400).json({ error: 'Current password is incorrect' });
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });
    res.json({ success: true });
  } catch (err) { next(err); }
}

async function deleteAccount(req, res, next) {
  try {
    if (req.user.role !== 'tenant')
      return res.status(403).json({ error: 'Please contact info@hausfindrr.com to delete a landlord account.' });
    const userId = req.user.id;
    await prisma.$transaction([
      prisma.favorite.deleteMany({ where: { tenantId: userId } }),
      prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } }),
      prisma.complaint.deleteMany({ where: { OR: [{ tenantId: userId }, { landlordId: userId }] } }),
      prisma.announcement.deleteMany({ where: { senderId: userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);
    res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = {
  registerLandlord, registerTenant, login, me, acceptTerms, completeProfile,
  updateProfile, changePassword, deleteAccount,
  // Exported for use by oauthController
  createWelcomeNotifications, sendWelcomeMessages, generateAccountCode,
};
