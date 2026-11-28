const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');
const { getSettings } = require('../services/notificationService');

async function getMyNotifications(req, res, next) {
  try {
    const notifications = await prisma.userNotification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    const unreadCount = notifications.filter(n => !n.readAt).length;
    res.json({ notifications, unreadCount });
  } catch (err) { next(err); }
}

async function getUnreadCount(req, res, next) {
  try {
    const count = await prisma.userNotification.count({
      where: { userId: req.user.id, readAt: null },
    });
    res.json({ count });
  } catch (err) { next(err); }
}

async function markRead(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.userNotification.updateMany({
      where: { id, userId: req.user.id },
      data: { readAt: new Date() },
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
}

async function markAllRead(req, res, next) {
  try {
    await prisma.userNotification.updateMany({
      where: { userId: req.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
}

// Push subscriptions ──────────────────────────────────────────────────────────

async function subscribePush(req, res, next) {
  try {
    const { endpoint, keys, userAgent } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth)
      return res.status(400).json({ error: 'endpoint, keys.p256dh and keys.auth required' });

    await prisma.pushSubscription.upsert({
      where:  { endpoint },
      update: { userId: req.user.id, p256dh: keys.p256dh, auth: keys.auth, userAgent: userAgent || null },
      create: { id: uuidv4(), userId: req.user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent: userAgent || null },
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
}

async function unsubscribePush(req, res, next) {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ error: 'endpoint required' });
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: req.user.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
}

// Notification settings ───────────────────────────────────────────────────────

async function getNotificationSettings(req, res, next) {
  try {
    const settings = await getSettings(req.user.id);
    res.json({ settings });
  } catch (err) { next(err); }
}

async function updateNotificationSettings(req, res, next) {
  try {
    const allowed = ['pushMessages', 'pushVerification', 'pushListings', 'emailVerification', 'emailListingUpdates', 'setupReminders'];
    const data = {};
    for (const key of allowed) {
      if (typeof req.body[key] === 'boolean') data[key] = req.body[key];
    }
    // Handle push prompt dismissal
    if (req.body.dismissPrompt === true) {
      data.promptDismissedAt = new Date();
    }
    const settings = await prisma.notificationSettings.upsert({
      where:  { userId: req.user.id },
      update: data,
      create: { id: uuidv4(), userId: req.user.id, ...data },
    });
    res.json({ settings });
  } catch (err) { next(err); }
}

module.exports = {
  getMyNotifications, getUnreadCount,
  markRead, markAllRead,
  subscribePush, unsubscribePush,
  getNotificationSettings, updateNotificationSettings,
};
