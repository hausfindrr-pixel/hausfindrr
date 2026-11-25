const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Salt rotates daily — derived from a server secret + the current UTC date string.
// This means anonymous hashes cannot be traced across days.
function dailySalt() {
  const secret = process.env.VIEW_SALT_SECRET || 'hausfindrr-view-salt-default';
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
  return crypto.createHmac('sha256', secret).update(date).digest('hex');
}

function anonHash(ip, ua, propertyId, date) {
  return crypto
    .createHmac('sha256', dailySalt())
    .update(`${ip}|${ua}|${propertyId}|${date}`)
    .digest('hex');
}

const BOT_UA_RE = /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|developers\.google\.com\/\+\/web\/snippet|www\.google\.com\/webmasters\/tools\//i;

// POST /properties/:id/view
async function recordView(req, res) {
  const { id: propertyId } = req.params;
  const userId = req.user?.id ?? null;
  const userRole = req.user?.role ?? null;

  // Exclude owner and admins
  if (userRole === 'admin') return res.json({ ok: true });

  const ua = req.headers['user-agent'] || '';
  if (BOT_UA_RE.test(ua)) return res.json({ ok: true });

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  try {
    // Check owner
    if (userId) {
      const prop = await prisma.property.findUnique({ where: { id: propertyId }, select: { landlordId: true } });
      if (!prop) return res.status(404).json({ error: 'Not found' });
      if (prop.landlordId === userId) return res.json({ ok: true });
    }

    if (userId) {
      // Authenticated: upsert by (propertyId, date, viewerId)
      await prisma.$executeRaw`
        INSERT INTO property_view_logs (id, property_id, viewed_on, viewer_id)
        VALUES (gen_random_uuid(), ${propertyId}, ${today}::date, ${userId})
        ON CONFLICT ON CONSTRAINT property_view_logs_property_id_viewed_on_viewer_id_key DO NOTHING
      `;
    } else {
      const ip = req.ip || req.socket?.remoteAddress || '';
      const hash = anonHash(ip, ua, propertyId, today);
      await prisma.$executeRaw`
        INSERT INTO property_view_logs (id, property_id, viewed_on, anon_hash)
        VALUES (gen_random_uuid(), ${propertyId}, ${today}::date, ${hash})
        ON CONFLICT ON CONSTRAINT property_view_logs_property_id_viewed_on_anon_hash_key DO NOTHING
      `;
    }

    // Update daily summary (upsert)
    await prisma.$executeRaw`
      INSERT INTO property_view_summaries (id, property_id, summary_date, unique_views)
      SELECT gen_random_uuid(), property_id, viewed_on, COUNT(*)
      FROM property_view_logs
      WHERE property_id = ${propertyId} AND viewed_on = ${today}::date
      GROUP BY property_id, viewed_on
      ON CONFLICT (property_id, summary_date)
      DO UPDATE SET unique_views = EXCLUDED.unique_views
    `;

    res.json({ ok: true });
  } catch (err) {
    // Non-fatal — view recording failure shouldn't break the page load
    console.error('recordView error:', err.message);
    res.json({ ok: true });
  }
}

// GET /properties/:id/stats
async function getStats(req, res) {
  const { id: propertyId } = req.params;

  try {
    const now = new Date();
    const day7  = new Date(now); day7.setDate(day7.getDate() - 7);
    const day30 = new Date(now); day30.setDate(day30.getDate() - 30);

    const [v7, v30, vAll, msgCount] = await Promise.all([
      prisma.propertyViewSummary.aggregate({
        where: { propertyId, summaryDate: { gte: day7 } },
        _sum: { uniqueViews: true },
      }),
      prisma.propertyViewSummary.aggregate({
        where: { propertyId, summaryDate: { gte: day30 } },
        _sum: { uniqueViews: true },
      }),
      prisma.propertyViewSummary.aggregate({
        where: { propertyId },
        _sum: { uniqueViews: true },
      }),
      // Distinct tenants (non-owner senders) who have messaged about this listing
      prisma.message.findMany({
        where: { propertyId },
        select: { senderId: true },
        distinct: ['senderId'],
      }).then(rows => {
        // Exclude the property owner — need to check landlordId
        return prisma.property.findUnique({ where: { id: propertyId }, select: { landlordId: true } })
          .then(prop => rows.filter(r => r.senderId !== prop?.landlordId).length);
      }),
    ]);

    res.json({
      views: {
        day7:    v7._sum.uniqueViews  || 0,
        day30:   v30._sum.uniqueViews || 0,
        allTime: vAll._sum.uniqueViews || 0,
      },
      messageCount: msgCount,
    });
  } catch (err) {
    console.error('getStats error:', err.message);
    res.status(500).json({ error: 'Stats unavailable' });
  }
}

module.exports = { recordView, getStats };
