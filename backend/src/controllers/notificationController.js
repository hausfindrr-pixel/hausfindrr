const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getMyNotifications(req, res, next) {
  try {
    const notifications = await prisma.userNotification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ notifications });
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

module.exports = { getMyNotifications, markRead };
