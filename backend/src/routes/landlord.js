const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('landlord'));

// Landlord profile info
router.get('/profile', async (req, res, next) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { landlordDocuments: true },
    });
    if (!user) return res.status(404).json({ error: 'Not found' });
    const { passwordHash, ...safe } = user;
    res.json({ user: safe });
  } catch (err) { next(err); }
});

module.exports = router;
