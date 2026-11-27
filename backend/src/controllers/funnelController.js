const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ALLOWED_EVENTS = new Set([
  'page_opened',
  'account_created',
  'listing_started',
  'listing_submitted',
  'id_uploaded',
]);

async function recordEvent(req, res, next) {
  try {
    const { event, campaign } = req.body;
    if (!event || !ALLOWED_EVENTS.has(event))
      return res.status(400).json({ error: 'Invalid event' });

    const safeCampaign = typeof campaign === 'string' ? campaign.slice(0, 100) : null;
    await prisma.funnelEvent.create({ data: { event, campaign: safeCampaign || null } });
    res.status(201).json({ ok: true });
  } catch (err) { next(err); }
}

async function getFunnelReport(req, res, next) {
  try {
    // Counts by day × event × campaign (last 30 days)
    const byDay = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('day', happened_at AT TIME ZONE 'UTC')::date AS day,
        event,
        COALESCE(campaign, '(direct)') AS campaign,
        COUNT(*)::int AS count
      FROM funnel_events
      WHERE happened_at >= NOW() - INTERVAL '30 days'
      GROUP BY 1, 2, 3
      ORDER BY 1 DESC, 3, 2
    `;

    // All-time totals by event × campaign
    const totals = await prisma.$queryRaw`
      SELECT
        event,
        COALESCE(campaign, '(direct)') AS campaign,
        COUNT(*)::int AS count
      FROM funnel_events
      GROUP BY 1, 2
      ORDER BY 2, 1
    `;

    res.json({ byDay, totals });
  } catch (err) { next(err); }
}

module.exports = { recordEvent, getFunnelReport };
