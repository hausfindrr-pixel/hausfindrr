const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getConsentLogs(req, res, next) {
  try {
    const { userId, document, limit = '100', offset = '0' } = req.query;

    const where = {};
    if (userId)   where.userId   = userId;
    if (document) where.document = document;

    const [logs, total] = await Promise.all([
      prisma.consentLog.findMany({
        where,
        orderBy: { acceptedAt: 'desc' },
        take: Math.min(Number(limit) || 100, 500),
        skip: Number(offset) || 0,
      }),
      prisma.consentLog.count({ where }),
    ]);

    res.json({ logs, total });
  } catch (err) {
    next(err);
  }
}

module.exports = { getConsentLogs };
