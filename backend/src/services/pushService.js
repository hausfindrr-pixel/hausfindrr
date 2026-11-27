const webpush = require('web-push');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL   = process.env.VAPID_EMAIL || 'mailto:info@hausfindrr.com';

let _configured = false;
function ensureConfigured() {
  if (_configured || !VAPID_PUBLIC || !VAPID_PRIVATE) return;
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
  _configured = true;
}

async function sendPushToUser(userId, title, body, link) {
  ensureConfigured();
  if (!_configured) return; // VAPID keys not set — skip silently

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (!subs.length) return;

  const payload = JSON.stringify({ title, body, link: link || '/' });
  const stale = [];

  await Promise.allSettled(subs.map(async sub => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
        { TTL: 60 * 60 * 24 }, // 24h TTL
      );
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        stale.push(sub.id);
      }
    }
  }));

  if (stale.length) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: stale } } });
  }
}

module.exports = { sendPushToUser };
