const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const {
  createWelcomeNotifications,
  sendWelcomeMessages,
  generateAccountCode,
} = require('./authController');

const prisma = new PrismaClient();

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://hausfindrr.com';
const TERMS_VERSION = 'v1.0-july2026';

function makeOAuthClient() {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL,
  );
}

function signFullToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, status: user.status },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );
}

function signOAuthTempToken(data) {
  return jwt.sign(
    { ...data, type: 'oauth_pending' },
    process.env.JWT_SECRET,
    { expiresIn: '20m' },
  );
}

function safeUser(u) {
  const { passwordHash, ...rest } = u;
  return rest;
}

function clamp(val, max) {
  return typeof val === 'string' ? val.slice(0, max) : val;
}

// GET /api/auth/google
function initiateGoogleAuth(req, res) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${FRONTEND_URL}/oauth/callback?error=not_configured`);
  }

  const state = jwt.sign({ ts: Date.now() }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const client = makeOAuthClient();

  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    state,
    prompt: 'select_account',
  });

  res.redirect(authUrl);
}

// GET /api/auth/google/callback
async function googleCallback(req, res) {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${FRONTEND_URL}/oauth/callback?error=access_denied`);
  }

  try {
    jwt.verify(state, process.env.JWT_SECRET);
  } catch {
    return res.redirect(`${FRONTEND_URL}/oauth/callback?error=invalid_state`);
  }

  try {
    const client = makeOAuthClient();
    const { tokens } = await client.getToken(code);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    if (!email) {
      return res.redirect(`${FRONTEND_URL}/oauth/callback?error=no_email`);
    }

    const normalEmail = email.toLowerCase();

    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email: normalEmail }] },
    });

    if (user) {
      if (!user.googleId) {
        user = await prisma.user.update({ where: { id: user.id }, data: { googleId } });
      }
      if (user.status === 'suspended') {
        return res.redirect(`${FRONTEND_URL}/oauth/callback?error=suspended`);
      }
      const token = signFullToken(user);
      console.log(`[googleCallback] existing user login: ${user.email} (${user.role}), redirecting to ${FRONTEND_URL}/oauth/callback`);
      return res.redirect(
        `${FRONTEND_URL}/oauth/callback?token=${encodeURIComponent(token)}&status=login&role=${user.role}`,
      );
    }

    // New user — temp token with Google profile
    const tempToken = signOAuthTempToken({ googleId, email: normalEmail, name });
    console.log(`[googleCallback] new user signup: ${normalEmail}, redirecting to ${FRONTEND_URL}/oauth/callback`);
    return res.redirect(
      `${FRONTEND_URL}/oauth/callback?token=${encodeURIComponent(tempToken)}&status=signup&name=${encodeURIComponent(name || '')}`,
    );
  } catch (err) {
    console.error('[googleCallback] error:', err.message, err.stack);
    return res.redirect(`${FRONTEND_URL}/oauth/callback?error=auth_failed`);
  }
}

// POST /api/auth/google/complete — finish registration for new Google users
async function googleComplete(req, res, next) {
  try {
    const { tempToken, role, phone, agreedToTerms } = req.body;

    if (!tempToken || !role || !phone) {
      return res.status(400).json({ error: 'Missing required fields (tempToken, role, phone)' });
    }
    if (!['tenant', 'landlord'].includes(role)) {
      return res.status(400).json({ error: 'Role must be tenant or landlord' });
    }
    if (!agreedToTerms) {
      return res.status(400).json({ error: 'You must agree to the Terms of Service' });
    }

    let payload;
    try {
      payload = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Session expired — please sign in with Google again.' });
    }

    if (payload.type !== 'oauth_pending') {
      return res.status(401).json({ error: 'Invalid session token' });
    }

    const { googleId, email, name } = payload;

    // Race-condition guard
    let existing = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });
    if (existing) {
      if (!existing.googleId) {
        existing = await prisma.user.update({ where: { id: existing.id }, data: { googleId } });
      }
      const token = signFullToken(existing);
      return res.json({ token, user: safeUser(existing) });
    }

    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || 'unknown';
    const safePhone = clamp(phone, 30);
    const safeName = clamp(name, 100) || 'Google User';

    const userData = {
      name: safeName,
      phone: safePhone,
      email,
      googleId,
      passwordHash: null,
      role,
      status: role === 'landlord' ? 'pending_verification' : 'active',
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      termsAcceptedIp: ip,
      termsVersion: TERMS_VERSION,
    };

    if (role === 'landlord') {
      userData.accountCode = await generateAccountCode();
    }

    const user = await prisma.user.create({ data: userData });

    await createWelcomeNotifications(user.id, role);
    await sendWelcomeMessages(user.id, role);

    const token = signFullToken(user);
    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
}

module.exports = { initiateGoogleAuth, googleCallback, googleComplete };
