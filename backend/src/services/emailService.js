const nodemailer = require('nodemailer');

// Email is behind a flag. Set EMAIL_ENABLED=true plus SMTP credentials to activate.
const ENABLED = process.env.EMAIL_ENABLED === 'true';

let _transporter = null;
function getTransporter() {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return _transporter;
}

const FROM = process.env.EMAIL_FROM || 'HausFindrr <noreply@hausfindrr.com>';
const BASE_URL = process.env.FRONTEND_URL || 'https://hausfindrr.com';

async function sendTransactional(to, subject, text, ctaUrl, ctaLabel) {
  if (!ENABLED) return;
  try {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden">
    <tr><td style="background:#41271B;padding:24px 32px">
      <span style="color:#EDE0CE;font-size:20px;font-weight:700">HausFindrr</span>
    </td></tr>
    <tr><td style="padding:32px">
      <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#222">${text.replace(/\n/g, '<br>')}</p>
      ${ctaUrl ? `<a href="${BASE_URL}${ctaUrl}" style="display:inline-block;padding:12px 24px;background:#41271B;color:#EDE0CE;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">${ctaLabel || 'Open HausFindrr'}</a>` : ''}
    </td></tr>
    <tr><td style="padding:16px 32px 24px;border-top:1px solid #f0ebe4">
      <p style="margin:0;font-size:12px;color:#999">HausFindrr — PNG's property marketplace. <a href="${BASE_URL}/privacy" style="color:#975536">Privacy policy</a></p>
    </td></tr>
  </table>
</body></html>`;
    await getTransporter().sendMail({ from: FROM, to, subject, text, html });
  } catch (err) {
    console.error('[email] send error:', err.message);
  }
}

module.exports = { sendTransactional, ENABLED };
