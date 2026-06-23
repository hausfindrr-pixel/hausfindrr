const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getPendingLandlords(req, res, next) {
  try {
    const landlords = await prisma.user.findMany({
      where: { role: 'landlord', status: 'pending_verification' },
      include: { landlordIdDocuments: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ landlords });
  } catch (err) { next(err); }
}

async function verifyLandlord(req, res, next) {
  try {
    const { id } = req.params;
    const { action } = req.body; // action: 'approve' | 'reject'
    if (!['approve', 'reject'].includes(action))
      return res.status(400).json({ error: 'action must be approve or reject' });

    const status = action === 'approve' ? 'active' : 'rejected';
    const user = await prisma.user.update({ where: { id }, data: { status } });
    res.json({ user: { id: user.id, status: user.status } });
  } catch (err) { next(err); }
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
    res.json({ properties });
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
    });
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
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ landlords: landlords.map(u => { const { passwordHash, ...r } = u; return r; }) });
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
    res.json({ properties });
  } catch (err) { next(err); }
}

async function getAnalytics(req, res, next) {
  try {
    const [
      totalLandlords,
      totalTenants,
      totalActiveListings,
      totalUnlocks,
      revenueAgg,
      pendingLandlords,
      pendingListings,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'landlord', status: 'active' } }),
      prisma.user.count({ where: { role: 'tenant' } }),
      prisma.property.count({ where: { status: 'active' } }),
      prisma.unlock.count(),
      prisma.transaction.aggregate({
        where: { status: 'successful' },
        _sum: { amount: true },
      }),
      prisma.user.count({ where: { role: 'landlord', status: 'pending_verification' } }),
      prisma.property.count({ where: { status: 'pending' } }),
    ]);

    const totalRevenue = Number(revenueAgg._sum.amount || 0);

    // Recent activity — gather from 4 sources
    const [landlordEvents, propertyEvents, unlockEvents, messageEvents] = await Promise.all([
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
      prisma.unlock.findMany({
        orderBy: { unlockedAt: 'desc' },
        take: 5,
        include: {
          tenant: { select: { name: true } },
          property: { select: { title: true } },
        },
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
      ...unlockEvents.map(u => ({
        type: 'unlock',
        text: `${u.tenant.name} unlocked ${u.property.title}`,
        time: u.unlockedAt,
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

    // Revenue chart
    const recentUnlocks = await prisma.unlock.findMany({
      where: { unlockedAt: { gte: sevenDaysAgo } },
      select: { unlockedAt: true },
    });

    const revByDay = {};
    for (const { dateStr, label } of last7Days) {
      revByDay[dateStr] = { date: dateStr, label, unlocks: 0, revenue: 0 };
    }
    for (const u of recentUnlocks) {
      const dateStr = u.unlockedAt.toISOString().split('T')[0];
      if (revByDay[dateStr]) {
        revByDay[dateStr].unlocks++;
        revByDay[dateStr].revenue += 25;
      }
    }
    const revenueChart = last7Days.map(({ dateStr }) => revByDay[dateStr]);

    res.set('Cache-Control', 'private, max-age=60');
    res.json({
      totalLandlords,
      totalTenants,
      totalActiveListings,
      totalUnlocks,
      totalRevenue,
      pendingLandlords,
      pendingListings,
      recentActivity,
      registrationChart,
      revenueChart,
    });
  } catch (err) { next(err); }
}

async function getAllTransactions(req, res, next) {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        tenant: { select: { name: true, email: true } },
        property: { select: { title: true, locationGeneral: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const successfulTxns = transactions.filter(t => t.status === 'successful');

    const totalRevenue = Number(
      successfulTxns.reduce((sum, t) => sum + Number(t.amount || 0), 0)
    );

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthRevenue = Number(
      successfulTxns
        .filter(t => new Date(t.createdAt) >= startOfMonth)
        .reduce((sum, t) => sum + Number(t.amount || 0), 0)
    );

    res.json({
      transactions,
      totalRevenue,
      thisMonthRevenue,
      totalCount: transactions.length,
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
      prisma.unlock.deleteMany({ where: { propertyId: { in: propertyIds } } }),
      prisma.transaction.deleteMany({ where: { propertyId: { in: propertyIds } } }),
      prisma.property.deleteMany({ where: { id: { in: propertyIds } } }),
      prisma.landlordIdDocument.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = {
  getPendingLandlords, verifyLandlord,
  getPendingProperties, reviewProperty,
  getAllLandlords, getAllListings,
  getAnalytics,
  getAllTransactions,
  getAllMessages,
  suspendLandlord,
  deleteLandlord,
};
