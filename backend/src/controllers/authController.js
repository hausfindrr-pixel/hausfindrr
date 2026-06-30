const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Normalise + validate an email address
function normaliseEmail(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().toLowerCase();
  return validator.isEmail(trimmed) ? trimmed : null;
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
      content: 'By using HausFindrr, you agree to our Privacy Policy. We collect your name, contact details, and identity documents solely to verify your account and facilitate property listings. Your personal data is never sold to third parties. You can request deletion of your account at any time by contacting support@hausfindrr.com.',
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
      content: 'Welcome to HausFindrr! You can now browse thousands of rental and sale listings across PNG. Unlock a property to see full details, contact the landlord, and save your favourites. Happy house hunting!',
    },
    {
      type: 'privacy_policy',
      title: 'Our Privacy Policy',
      content: 'By using HausFindrr, you agree to our Privacy Policy. We collect your name and contact details to facilitate connections between tenants and landlords. Your personal data is never sold to third parties. You can request deletion of your account at any time by contacting support@hausfindrr.com.',
    },
    {
      type: 'terms',
      title: 'Terms of Service',
      content: 'By registering as a tenant on HausFindrr, you agree to our Terms of Service. You agree to use the platform honestly, not to misrepresent yourself to landlords, and to use contact details obtained through unlocking for legitimate housing enquiries only. HausFindrr reserves the right to suspend accounts that violate these terms.',
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
  tenant: `Welcome to HausFindrr — PNG's property marketplace! 🏠

You can now browse hundreds of rental and sale listings across the country. To see the full details of any listing — including the exact address and the landlord's direct contact — simply unlock it for a one-time fee of K25.

A few tips to get started:
• Browse listings from the homepage
• Tap "Unlock Now" on any listing that interests you
• Save favourites with the heart icon
• Message the landlord directly once you've unlocked a listing

Happy house hunting! If you ever need help, reply to this message or email us at support@hausfindrr.com.

— The HausFindrr Team`,

  landlord: `Welcome to HausFindrr — PNG's fastest-growing property platform! 🏠

Your account has been created and is currently under review. Our admin team will verify your identity and uploaded documents within 1–2 business days.

What happens next:
• We'll review your ID document and account details
• Once approved, you'll be able to post property listings
• Tenants can then browse and unlock your listings to get in touch

To speed up verification, make sure your ID document is uploaded clearly in your account. Listings you submit will be reviewed by our team before going live — this keeps the platform safe and trustworthy for everyone.

Questions? Reply to this message or email support@hausfindrr.com.

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
    const { name, phone, id_type } = req.body;
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
    const accountCode = await generateAccountCode();
    const user = await prisma.user.create({
      data: { name: safeName, phone: safePhone, email, passwordHash, role: 'landlord', status: 'pending_verification', accountCode },
    });

    // Save single ID document
    const files = req.files || {};
    const idFiles = files['id_document'] || [];
    const docType = normaliseIdDocType(id_type);

    if (idFiles.length > 0) {
      await prisma.landlordIdDocument.createMany({
        data: idFiles.map(f => ({
          userId: user.id,
          docType,
          filePath: f.path,
        })),
      });
    }

    await createWelcomeNotifications(user.id, 'landlord');
    await sendWelcomeMessages(user.id, 'landlord');

    const token = signToken(user);
    res.status(201).json({ token, user: safeUser(user) });
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
    const user = await prisma.user.create({
      data: { name: safeName, phone: safePhone, email, passwordHash, role: 'tenant', status: 'active' },
    });

    await createWelcomeNotifications(user.id, 'tenant');
    await sendWelcomeMessages(user.id, 'tenant');

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
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
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
    res.json({ user: safeUser(user) });
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

module.exports = { registerLandlord, registerTenant, login, me, acceptTerms };
