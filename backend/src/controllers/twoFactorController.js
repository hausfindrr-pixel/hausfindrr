const { authenticator } = require('otplib');
const qrcode = require('qrcode');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Configure TOTP: 6 digits, 30-second window, ±1 step tolerance
authenticator.options = { digits: 6, step: 30, window: 1 };

const APP_NAME = 'HausFindrr Admin';

// GET /api/admin/2fa/setup
// Generates a new TOTP secret (not enabled yet) and returns QR code data URL.
async function setupTwoFactor(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || user.role !== 'admin')
      return res.status(403).json({ error: 'Admin only' });

    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(user.email, APP_NAME, secret);
    const qrDataUrl = await qrcode.toDataURL(otpAuthUrl);

    // Store the secret temporarily (twoFactorEnabled stays false until confirmed)
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret },
    });

    res.json({ qrDataUrl, secret, message: 'Scan the QR code, then confirm with a 6-digit code.' });
  } catch (err) { next(err); }
}

// POST /api/admin/2fa/confirm
// Body: { code }
// Verifies the code, enables 2FA, and returns a one-time backup code.
async function confirmTwoFactor(req, res, next) {
  try {
    const { code } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user || user.role !== 'admin')
      return res.status(403).json({ error: 'Admin only' });
    if (!user.twoFactorSecret)
      return res.status(400).json({ error: 'Run 2FA setup first' });

    const valid = authenticator.verify({ token: String(code).trim(), secret: user.twoFactorSecret });
    if (!valid)
      return res.status(400).json({ error: 'Invalid or expired code. Try again.' });

    // Generate a one-time backup code (plain text shown once, stored as bcrypt hash)
    const backupCode = crypto.randomBytes(5).toString('hex').toUpperCase(); // e.g. "A3F92B1D4C"
    const backupHash = await bcrypt.hash(backupCode, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true, twoFactorBackupHash: backupHash },
    });

    res.json({
      success: true,
      backupCode,
      message: 'Two-factor authentication is now active. Save your backup code — it will only be shown once.',
    });
  } catch (err) { next(err); }
}

// POST /api/admin/2fa/disable
// Body: { code } — requires a valid TOTP code to disable
async function disableTwoFactor(req, res, next) {
  try {
    const { code } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user || user.role !== 'admin')
      return res.status(403).json({ error: 'Admin only' });
    if (!user.twoFactorEnabled)
      return res.status(400).json({ error: '2FA is not enabled' });

    const valid = authenticator.verify({ token: String(code).trim(), secret: user.twoFactorSecret });
    if (!valid)
      return res.status(400).json({ error: 'Invalid code. Provide a valid TOTP code to disable 2FA.' });

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupHash: null },
    });

    res.json({ success: true, message: '2FA has been disabled.' });
  } catch (err) { next(err); }
}

// POST /api/auth/2fa/verify
// Body: { tempToken, code } or { tempToken, backupCode }
// Called after password login when 2FA is required.
async function verifyTwoFactor(req, res, next) {
  try {
    const jwt = require('jsonwebtoken');
    const { tempToken, code, backupCode } = req.body;

    if (!tempToken)
      return res.status(400).json({ error: 'Missing temp token' });

    let payload;
    try {
      payload = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    if (payload.type !== '2fa_pending')
      return res.status(401).json({ error: 'Invalid token type' });

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.twoFactorEnabled)
      return res.status(401).json({ error: 'Invalid session' });

    // --- TOTP code path ---
    if (code) {
      const valid = authenticator.verify({ token: String(code).trim(), secret: user.twoFactorSecret });
      if (!valid)
        return res.status(401).json({ error: 'Incorrect or expired code. Please try again.' });
    }
    // --- Backup code path ---
    else if (backupCode) {
      if (!user.twoFactorBackupHash)
        return res.status(401).json({ error: 'No backup code on record' });

      const match = await bcrypt.compare(String(backupCode).trim().toUpperCase(), user.twoFactorBackupHash);
      if (!match)
        return res.status(401).json({ error: 'Invalid backup code' });

      // Invalidate the backup code after single use
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorBackupHash: null },
      });
    } else {
      return res.status(400).json({ error: 'Provide a 6-digit code or backup code' });
    }

    // Issue full access token
    const token = jwt.sign(
      { id: user.id, role: user.role, status: user.status },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const { passwordHash, twoFactorSecret, twoFactorBackupHash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) { next(err); }
}

module.exports = { setupTwoFactor, confirmTwoFactor, disableTwoFactor, verifyTwoFactor };
