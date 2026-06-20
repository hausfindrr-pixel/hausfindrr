const { PrismaClient } = require('@prisma/client');
const { processUnlockPayment, UNLOCK_AMOUNT } = require('../services/paymentService');
const prisma = new PrismaClient();

async function unlockProperty(req, res, next) {
  try {
    const { propertyId } = req.params;
    const { cardNumber, cardExpiry, cardCvv, cardName } = req.body;
    const tenantId = req.user.id;

    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property || property.status !== 'active')
      return res.status(404).json({ error: 'Property not found' });

    // Already unlocked?
    const existing = await prisma.unlock.findUnique({
      where: { tenantId_propertyId: { tenantId, propertyId } },
    });
    if (existing) return res.json({ already_unlocked: true, message: 'Already unlocked' });

    const { transaction, success } = await processUnlockPayment(
      tenantId, propertyId, UNLOCK_AMOUNT,
      { number: cardNumber, expiry: cardExpiry, cvv: cardCvv, name: cardName }
    );

    if (!success) {
      return res.status(402).json({ error: 'Payment failed. Please check your card details.' });
    }

    const unlock = await prisma.unlock.create({ data: { tenantId, propertyId } });
    res.json({ unlocked: true, unlock, transaction });
  } catch (err) {
    next(err);
  }
}

async function getUnlockedProperties(req, res, next) {
  try {
    const unlocks = await prisma.unlock.findMany({
      where: { tenantId: req.user.id },
      include: {
        property: {
          include: { photos: true, amenities: true, landlord: { select: { id: true, name: true, phone: true, email: true } } },
        },
      },
      orderBy: { unlockedAt: 'desc' },
    });
    res.json({ unlocks });
  } catch (err) {
    next(err);
  }
}

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

module.exports = { unlockProperty, getUnlockedProperties, toggleFavorite, getFavorites };
