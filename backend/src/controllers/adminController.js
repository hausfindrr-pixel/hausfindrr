const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { notify, notifyFavoriteWatchers } = require('../services/notificationService');

async function attachStats(properties) {
  if (!properties.length) return properties;
  const ids = properties.map(p => p.id);
  const [viewAll, msgRows] = await Promise.all([
    prisma.propertyViewSummary.groupBy({
      by: ['propertyId'],
      where: { propertyId: { in: ids } },
      _sum: { uniqueViews: true },
    }),
    prisma.$queryRaw`
      SELECT property_id, COUNT(DISTINCT sender_id)::int AS cnt
      FROM messages
      WHERE property_id = ANY(${ids}::text[])
      GROUP BY property_id
    `,
  ]);
  const viewMap = Object.fromEntries(viewAll.map(r => [r.propertyId, r._sum.uniqueViews || 0]));
  const msgMap  = Object.fromEntries(msgRows.map(r => [r.property_id, r.cnt]));
  return properties.map(p => ({
    ...p,
    stats: { viewsAllTime: viewMap[p.id] || 0, messageCount: msgMap[p.id] || 0 },
  }));
}

async function getPendingLandlords(req, res, next) {
  try {
    const landlords = await prisma.user.findMany({
      where: {
        role: 'landlord',
        status: 'pending_verification',
        landlordIdDocuments: { some: {} },
      },
      include: { landlordIdDocuments: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ landlords });
  } catch (err) { next(err); }
}

async function verifyLandlord(req, res, next) {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // action: 'approve' | 'reject'
    if (!['approve', 'reject'].includes(action))
      return res.status(400).json({ error: 'action must be approve or reject' });

    const status = action === 'approve' ? 'active' : 'rejected';
    const updateData = { status };
    if (action === 'reject') updateData.rejectionReason = reason || null;
    if (action === 'approve') {
      updateData.rejectionReason = null;
      updateData.revocationReason = null;
      const existing = await prisma.user.findUnique({ where: { id }, select: { firstVerifiedAt: true } });
      if (!existing?.firstVerifiedAt) updateData.firstVerifiedAt = new Date();
    }
    const user = await prisma.user.update({ where: { id }, data: updateData });

    // On approve: restore any listings paused by revocation
    if (action === 'approve') {
      await prisma.property.updateMany({
        where: { landlordId: id, revokedPause: true },
        data: { revokedPause: false },
      });
    }

    // Log the action
    await prisma.verificationLog.create({
      data: {
        userId: id,
        adminId: req.user?.id || null,
        action: action === 'approve' ? 'approved' : 'rejected',
        reason: reason || null,
      },
    });

    if (action === 'approve') {
      notify(id, {
        type:  'id_approved',
        title: 'Your ID has been verified',
        body:  'Your account is now active. You can list properties and tenants can contact you.',
        link:  '/landlord/dashboard',
        emailText: 'Great news — your HausFindrr account has been verified. You can now post listings and receive messages from tenants.',
        emailCtaUrl: '/landlord/dashboard',
        emailCtaLabel: 'Go to your account',
      });
    } else {
      const reasonNote = reason ? ` Reason: ${reason}.` : '';
      notify(id, {
        type:  'id_rejected',
        title: 'ID not accepted',
        body:  `We could not verify your ID.${reasonNote} Please upload a clearer copy in your account.`,
        link:  '/landlord/dashboard',
        emailText: `Your HausFindrr ID verification was not successful.${reasonNote}\n\nPlease sign in and upload a clearer copy of your passport or driver's licence.`,
        emailCtaUrl: '/landlord/dashboard',
        emailCtaLabel: 'Upload a new ID',
      });
    }

    res.json({ user: { id: user.id, status: user.status } });
  } catch (err) { next(err); }
}

async function revokeVerification(req, res, next) {
  try {
    const { id } = req.params;
    const { reason, pauseListings = false } = req.body;
    if (!reason || !reason.trim())
      return res.status(400).json({ error: 'reason is required' });

    const landlord = await prisma.user.findUnique({ where: { id } });
    if (!landlord || landlord.role !== 'landlord')
      return res.status(404).json({ error: 'Landlord not found' });
    if (landlord.status !== 'active')
      return res.status(400).json({ error: 'Landlord is not currently verified' });

    const updated = await prisma.user.update({
      where: { id },
      data: { status: 'id_needed', revocationReason: reason.trim() },
    });

    let pausedCount = 0;
    if (pauseListings) {
      const { count } = await prisma.property.updateMany({
        where: { landlordId: id, status: 'active' },
        data: { revokedPause: true },
      });
      pausedCount = count;
    }

    await prisma.verificationLog.create({
      data: {
        userId: id,
        adminId: req.user?.id || null,
        action: 'revoked',
        reason: reason.trim(),
      },
    });

    notify(id, {
      type:  'id_needed',
      title: 'Please upload your ID to stay Verified',
      body:  reason.trim(),
      link:  '/landlord/dashboard',
    });

    res.json({ status: updated.status, pausedCount });
  } catch (err) {
    console.error('[revokeVerification]', err);
    next(err);
  }
}

async function getPendingProperties(req, res, next) {
  try {
    const properties = await prisma.property.findMany({
      where: { status: 'pending' },
      include: {
        photos: true,
        amenities: true,
        titleDocuments: true,
        landlord: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ properties: await attachStats(properties) });
  } catch (err) { next(err); }
}

async function reviewProperty(req, res, next) {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;
    if (!['approve', 'reject'].includes(action))
      return res.status(400).json({ error: 'action must be approve or reject' });

    const status = action === 'approve' ? 'active' : 'rejected';
    const property = await prisma.property.update({
      where: { id },
      data: { status, rejectionReason: reason || null },
      include: { landlord: { select: { id: true } } },
    });

    if (action === 'approve') {
      const prevActive = await prisma.property.count({
        where: { landlordId: property.landlord.id, status: 'active', id: { not: property.id } },
      });
      notify(property.landlord.id, {
        type:  prevActive === 0 ? 'listing_first_live' : 'listing_live',
        title: prevActive === 0 ? 'Your first listing is live!' : 'Your listing is now live',
        body:  `"${property.title}" has been approved and is now visible to tenants.`,
        link:  `/property/${property.id}`,
      });
    } else {
      const reasonNote = reason ? ` Reason: ${reason}.` : '';
      notify(property.landlord.id, {
        type:  'listing_removed',
        title: 'Listing not approved',
        body:  `"${property.title}" was not approved.${reasonNote}`,
        link:  '/landlord/properties',
        emailText: `Your listing "${property.title}" was not approved by our team.${reasonNote}\n\nIf you have questions, reply to this email.`,
        emailCtaUrl: '/landlord/properties',
        emailCtaLabel: 'View your listings',
      });
      // Notify tenants who saved this listing
      notifyFavoriteWatchers(id, 'saved_listing_removed', 'A saved listing was removed', `"${property.title}" is no longer available.`);
    }

    res.json({ property: { id: property.id, status: property.status } });
  } catch (err) { next(err); }
}

async function getAllLandlords(req, res, next) {
  try {
    const landlords = await prisma.user.findMany({
      where: { role: 'landlord' },
      include: {
        landlordIdDocuments: true,
        properties: { select: { id: true, status: true } },
        verificationLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ landlords: landlords.map(u => {
      const { passwordHash, ...r } = u;
      let stage;
      if (u.status === 'suspended') stage = 'suspended';
      else if (u.status === 'rejected') stage = 'rejected';
      else if (u.status === 'id_needed') stage = 'id_needed';
      else if (u.status === 'pending_verification') {
        stage = u.landlordIdDocuments?.length > 0 ? 'under_review' : 'no_id';
      } else if (u.status === 'active') {
        stage = u.properties?.some(p => p.status === 'active') ? 'live' : 'no_listing';
      } else stage = 'unknown';
      return { ...r, onboardingStage: stage };
    }) });
  } catch (err) { next(err); }
}

async function getAllListings(req, res, next) {
  try {
    const properties = await prisma.property.findMany({
      include: {
        photos: true,
        amenities: true,
        titleDocuments: true,
        landlord: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ properties: await attachStats(properties) });
  } catch (err) { next(err); }
}

async function getAnalytics(req, res, next) {
  try {
    const [
      totalLandlords,
      totalTenants,
      totalActiveListings,
      pendingLandlords,
      pendingListings,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'landlord', status: 'active' } }),
      prisma.user.count({ where: { role: 'tenant' } }),
      prisma.property.count({ where: { status: 'active' } }),
      prisma.user.count({ where: { role: 'landlord', status: 'pending_verification' } }),
      prisma.property.count({ where: { status: 'pending' } }),
    ]);

    // Recent activity — gather from 3 sources
    const [landlordEvents, propertyEvents, messageEvents] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'landlord' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { name: true, createdAt: true },
      }),
      prisma.property.findMany({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { title: true, locationGeneral: true, createdAt: true },
      }),
      prisma.message.findMany({
        orderBy: { sentAt: 'desc' },
        take: 5,
        include: {
          sender: { select: { name: true } },
          receiver: { select: { name: true } },
        },
      }),
    ]);

    const allEvents = [
      ...landlordEvents.map(u => ({
        type: 'landlord_register',
        text: `New landlord registered: ${u.name}`,
        time: u.createdAt,
      })),
      ...propertyEvents.map(p => ({
        type: 'listing_active',
        text: `Listing active: ${p.title}, ${p.locationGeneral}`,
        time: p.createdAt,
      })),
      ...messageEvents.map(m => ({
        type: 'message',
        text: `New message: ${m.sender.name} → ${m.receiver.name}`,
        time: m.sentAt,
      })),
    ];

    const recentActivity = allEvents
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10);

    // Build 7-day date range
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Generate last 7 days as dateStr array (oldest first)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = dayLabels[d.getDay()];
      last7Days.push({ dateStr, label });
    }

    // Registration chart
    const registrationUsers = await prisma.user.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        role: { in: ['landlord', 'tenant'] },
      },
      select: { role: true, createdAt: true },
    });

    const regByDay = {};
    for (const { dateStr, label } of last7Days) {
      regByDay[dateStr] = { date: dateStr, label, landlords: 0, tenants: 0 };
    }
    for (const u of registrationUsers) {
      const dateStr = u.createdAt.toISOString().split('T')[0];
      if (regByDay[dateStr]) {
        if (u.role === 'landlord') regByDay[dateStr].landlords++;
        else if (u.role === 'tenant') regByDay[dateStr].tenants++;
      }
    }
    const registrationChart = last7Days.map(({ dateStr }) => regByDay[dateStr]);

    res.set('Cache-Control', 'private, max-age=60');
    res.json({
      totalLandlords,
      totalTenants,
      totalActiveListings,
      pendingLandlords,
      pendingListings,
      recentActivity,
      registrationChart,
    });
  } catch (err) { next(err); }
}


async function getAllMessages(req, res, next) {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { sentAt: 'desc' },
      take: 200,
      include: {
        sender: { select: { name: true, role: true } },
        receiver: { select: { name: true, role: true } },
        property: { select: { id: true, title: true, locationGeneral: true } },
      },
    });

    const threadMap = {};
    for (const msg of messages) {
      const key = `${msg.propertyId}:${[msg.senderId, msg.receiverId].sort().join(':')}`;
      if (!threadMap[key]) {
        threadMap[key] = {
          key,
          property: msg.property,
          participants: [msg.sender.name, msg.receiver.name],
          lastMessage: {
            content: msg.content,
            sentAt: msg.sentAt,
            senderName: msg.sender.name,
          },
          messageCount: 1,
        };
      } else {
        threadMap[key].messageCount++;
        // Messages are ordered desc so first encountered is already the latest
      }
    }

    const threads = Object.values(threadMap);

    res.json({ threads });
  } catch (err) { next(err); }
}

async function suspendLandlord(req, res, next) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== 'landlord')
      return res.status(404).json({ error: 'Landlord not found' });

    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    const updated = await prisma.user.update({ where: { id }, data: { status: newStatus } });
    res.json({ status: updated.status });
  } catch (err) { next(err); }
}

async function deleteLandlord(req, res, next) {
  try {
    const { id } = req.params;
    const properties = await prisma.property.findMany({
      where: { landlordId: id },
      select: { id: true },
    });
    const propertyIds = properties.map(p => p.id);

    await prisma.$transaction([
      prisma.message.deleteMany({ where: { propertyId: { in: propertyIds } } }),
      prisma.favorite.deleteMany({ where: { propertyId: { in: propertyIds } } }),
      prisma.property.deleteMany({ where: { id: { in: propertyIds } } }),
      prisma.landlordIdDocument.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = {
  getPendingLandlords, verifyLandlord, revokeVerification,
  getPendingProperties, reviewProperty,
  getAllLandlords, getAllListings,
  getAnalytics,
  getAllMessages,
  suspendLandlord,
  deleteLandlord,
};
