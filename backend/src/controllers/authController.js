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
    const user = await prisma.user.create({
      data: { name: safeName, phone: safePhone, email, passwordHash, role: 'landlord', status: 'pending_verification' },
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
