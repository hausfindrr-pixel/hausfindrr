const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendPushToUser } = require('./pushService');
const { sendTransactional } = require('./emailService');
const { v4: uuidv4 } = require('uuid');

// Map notification type → settings category
const PUSH_CATEGORY = {
  id_add_prompt:        'pushVerification',
  id_received:          'pushVerification',
  id_approved:          'pushVerification',
  id_rejected:          'pushVerification',
  id_deleted:           'pushVerification',
  listing_live:         'pushListings',
  listing_first_live:   'pushListings',
  listing_removed:      'pushListings',
  listing_rented:       'pushListings',
  saved_listing_rented: 'pushListings',
  saved_listing_removed:'pushListings',
  message_new:          'pushMessages',
  reminder_id:          'pushVerification',
  reminder_listing:     'pushListings',
};
const EMAIL_CATEGORY = {
  id_approved:     'emailVerification',
  id_rejected:     'emailVerification',
  listing_removed: 'emailListingUpdates',
};

async function getSettings(userId) {
  return prisma.notificationSettings.upsert({
    where:  { userId },
    update: {},
    create: { id: uuidv4(), userId },
  });
}

/**
 * Create an in-app notification and optionally fire push + email.
 * All errors are swallowed — notifications are non-fatal.
 */
async function notify(userId, { type, title, body, link, emailText, emailCtaUrl, emailCtaLabel } = {}) {
  try {
    await prisma.userNotification.create({
      data: { id: uuidv4(), userId, type, title, content: body, link: link || null },
    });

    const settings = await getSettings(userId);

    // Push
    const pushCat = PUSH_CATEGORY[type];
    if (pushCat && settings[pushCat]) {
      await sendPushToUser(userId, title, body, link).catch(() => {});
    }

    // Email (only for specific types with explicit text)
    const emailCat = EMAIL_CATEGORY[type];
    if (emailCat && settings[emailCat] && emailText) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      if (user) {
        const subject = title;
        await sendTransactional(user.email, subject, emailText, emailCtaUrl, emailCtaLabel).catch(() => {});
      }
    }
  } catch (err) {
    console.error('[notify] error for user', userId, ':', err.message);
  }
}

/**
 * Throttled message notification: at most one per conversation per 10 minutes.
 * conversationKey = `${propertyId}:${senderId}:${receiverId}` (canonical pair).
 */
async function notifyMessage(receiverId, { senderName, propertyTitle, propertyId, senderId }) {
  try {
    const TEN_MIN = new Date(Date.now() - 10 * 60 * 1000);
    const convLink = propertyId
      ? `/conversation/${propertyId}/${senderId}`
      : `/conversation/direct/${senderId}`;

    const recent = await prisma.userNotification.findFirst({
      where: {
        userId: receiverId,
        type: 'message_new',
        link: convLink,
        createdAt: { gte: TEN_MIN },
      },
    });
    if (recent) return; // throttled

    const title = propertyTitle
      ? `New message about ${propertyTitle}`
      : `New message from ${senderName}`;

    await notify(receiverId, {
      type:  'message_new',
      title,
      body:  `${senderName} sent you a message.`,
      link:  convLink,
    });
  } catch (err) {
    console.error('[notifyMessage] error:', err.message);
  }
}

/**
 * Notify all tenants who favorited a property that it has changed.
 */
async function notifyFavoriteWatchers(propertyId, type, title, body) {
  try {
    const favs = await prisma.favorite.findMany({
      where: { propertyId },
      select: { tenantId: true },
    });
    const link = `/property/${propertyId}`;
    await Promise.all(
      favs.map(f => notify(f.tenantId, { type, title, body, link }))
    );
  } catch (err) {
    console.error('[notifyFavoriteWatchers] error:', err.message);
  }
}

/**
 * Notify all admin users of an event.
 */
async function notifyAdmin(type, title, body, link) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true },
    });
    await Promise.all(
      admins.map(a => notify(a.id, { type, title, body, link }))
    );
  } catch (err) {
    console.error('[notifyAdmin] error:', err.message);
  }
}

async function runOnboardingReminders() {
  try {
    const now = new Date();
    // Port Moresby UTC+10: quiet hours 9pm–7am PMT = 11:00–21:00 UTC
    const utcHour = now.getUTCHours();
    if (utcHour >= 11 && utcHour < 21) return;

    const SCHEDULE = [1, 3, 7];
    const MAX = 3;

    // ID upload reminders
    const noIdCandidates = await prisma.user.findMany({
      where: { role: 'landlord', status: 'pending_verification', idReminderCount: { lt: MAX } },
      include: {
        landlordIdDocuments: { select: { id: true }, take: 1 },
        notificationSettings: { select: { setupReminders: true } },
      },
    });
    for (const u of noIdCandidates) {
      if (u.landlordIdDocuments.length > 0) continue;
      if (u.notificationSettings?.setupReminders === false) continue;
      const daysSince = Math.floor((now - u.createdAt) / 86400000);
      if (daysSince < SCHEDULE[u.idReminderCount]) continue;
      if (u.idReminderSentAt && (now - u.idReminderSentAt) < 23 * 3600000) continue;
      await notify(u.id, {
        type: 'reminder_id',
        title: 'Upload your ID to get Verified',
        body: 'Your ID is needed before you can list properties on HausFindrr.',
        link: '/landlord/dashboard',
      });
      await prisma.user.update({
        where: { id: u.id },
        data: { idReminderCount: { increment: 1 }, idReminderSentAt: now },
      });
    }

    // Listing reminders
    const noListingCandidates = await prisma.user.findMany({
      where: {
        role: 'landlord',
        status: 'active',
        firstVerifiedAt: { not: null },
        listingReminderCount: { lt: MAX },
      },
      include: {
        properties: { where: { status: 'active' }, select: { id: true }, take: 1 },
        notificationSettings: { select: { setupReminders: true } },
      },
    });
    for (const u of noListingCandidates) {
      if (u.properties.length > 0) continue;
      if (u.notificationSettings?.setupReminders === false) continue;
      const daysSince = Math.floor((now - u.firstVerifiedAt) / 86400000);
      if (daysSince < SCHEDULE[u.listingReminderCount]) continue;
      if (u.listingReminderSentAt && (now - u.listingReminderSentAt) < 23 * 3600000) continue;
      await notify(u.id, {
        type: 'reminder_listing',
        title: 'List your first property',
        body: "You're verified on HausFindrr — add your first listing to reach tenants.",
        link: '/landlord/properties',
      });
      await prisma.user.update({
        where: { id: u.id },
        data: { listingReminderCount: { increment: 1 }, listingReminderSentAt: now },
      });
    }
  } catch (err) {
    console.error('[runOnboardingReminders] error:', err.message);
  }
}

module.exports = { notify, notifyMessage, notifyFavoriteWatchers, notifyAdmin, getSettings, runOnboardingReminders };
