const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, status: user.status },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function registerLandlord(req, res, next) {
  try {
    const { name, phone, email, password, id_type } = req.body;
    if (!name || !phone || !email || !password)
      return res.status(400).json({ error: 'All fields required' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, phone, email, passwordHash, role: 'landlord', status: 'pending_verification' },
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
    const { name, phone, email, password } = req.body;
    if (!name || !phone || !email || !password)
      return res.status(400).json({ error: 'All fields required' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, phone, email, passwordHash, role: 'tenant', status: 'active' },
    });

    const token = signToken(user);
    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ error: 'Invalid credentials' });

    if (role && user.role !== role)
      return res.status(403).json({ error: `This account is not registered as a ${role}` });

    const token = signToken(user);
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
