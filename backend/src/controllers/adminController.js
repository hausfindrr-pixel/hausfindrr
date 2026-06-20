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

module.exports = {
  getPendingLandlords, verifyLandlord,
  getPendingProperties, reviewProperty,
  getAllLandlords, getAllListings,
};
