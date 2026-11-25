const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function toggleFavorite(req, res, next) {
  try {
    const { propertyId } = req.params;
    const tenantId = req.user.id;

    const existing = await prisma.favorite.findUnique({
      where: { tenantId_propertyId: { tenantId, propertyId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return res.json({ favorited: false });
    }

    await prisma.favorite.create({ data: { tenantId, propertyId } });
    res.json({ favorited: true });
  } catch (err) {
    next(err);
  }
}

async function isFavorited(req, res, next) {
  try {
    const { propertyId } = req.params;
    const existing = await prisma.favorite.findUnique({
      where: { tenantId_propertyId: { tenantId: req.user.id, propertyId } },
    });
    res.json({ favorited: !!existing });
  } catch (err) { next(err); }
}

async function getFavorites(req, res, next) {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { tenantId: req.user.id },
      include: {
        property: { include: { photos: true, amenities: true } },
      },
      orderBy: { savedAt: 'desc' },
    });
    res.json({ favorites });
  } catch (err) {
    next(err);
  }
}

module.exports = { toggleFavorite, isFavorited, getFavorites };
