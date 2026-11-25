const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /tenant/data-request or /landlord/data-request  (authenticated users)
async function createDataRequest(req, res, next) {
  try {
    const { type, notes } = req.body;
    if (!['export', 'deletion'].includes(type))
      return res.status(400).json({ error: 'type must be "export" or "deletion"' });

    // Prevent duplicate pending requests of the same type
    const existing = await prisma.dataRequest.findFirst({
      where: { userId: req.user.id, type, status: 'pending' },
    });
    if (existing)
      return res.status(409).json({ error: 'You already have a pending request of this type.' });

    const request = await prisma.dataRequest.create({
      data: {
        userId: req.user.id,
        userEmail: req.user.email,
        type,
        notes: notes?.trim() || null,
      },
    });

    res.status(201).json({ request });
  } catch (err) {
    next(err);
  }
}

// GET /admin/data-requests
async function getDataRequests(req, res, next) {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const requests = await prisma.dataRequest.findMany({
      where,
      include: { user: { select: { id: true, email: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ requests });
  } catch (err) {
    next(err);
  }
}

// PATCH /admin/data-requests/:id/complete
async function completeDataRequest(req, res, next) {
  try {
    const { id } = req.params;
    const request = await prisma.dataRequest.update({
      where: { id },
      data: { status: 'completed' },
    });
    res.json({ request });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Request not found' });
    next(err);
  }
}

module.exports = { createDataRequest, getDataRequests, completeDataRequest };
