const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAnnouncement(req, res, next) {
  try {
    const { targetRole, content } = req.body;
    if (!targetRole || !content?.trim())
      return res.status(400).json({ error: 'targetRole and content are required' });
    if (!['tenant', 'landlord'].includes(targetRole))
      return res.status(400).json({ error: 'targetRole must be tenant or landlord' });

    const announcement = await prisma.announcement.create({
      data: { senderId: req.user.id, targetRole, content: content.trim() },
      include: { sender: { select: { id: true, name: true } } },
    });
    res.status(201).json({ announcement });
  } catch (err) {
    next(err);
  }
}

async function getAdminAnnouncements(req, res, next) {
  try {
    const { role } = req.query;
    const where = role ? { targetRole: role } : {};
    const announcements = await prisma.announcement.findMany({
      where,
      include: { sender: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ announcements });
  } catch (err) {
    next(err);
  }
}

async function getMyAnnouncements(req, res, next) {
  try {
    const role = req.user.role;
    if (!['tenant', 'landlord'].includes(role))
      return res.json({ announcements: [] });

    const announcements = await prisma.announcement.findMany({
      where: { targetRole: role },
      include: { sender: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ announcements });
  } catch (err) {
    next(err);
  }
}

module.exports = { createAnnouncement, getAdminAnnouncements, getMyAnnouncements };
