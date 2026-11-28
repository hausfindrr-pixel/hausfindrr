require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const cron = require('node-cron');
const { purgeExpiredDocuments } = require('./services/documentService');

const authRoutes = require('./routes/auth');
const oauthRoutes = require('./routes/oauth');
const landlordRoutes = require('./routes/landlord');
const tenantRoutes = require('./routes/tenant');
const adminRoutes = require('./routes/admin');
const propertyRoutes = require('./routes/property');
const messageRoutes = require('./routes/message');
const complaintRoutes = require('./routes/complaint');
const announcementRoutes = require('./routes/announcement');
const notificationRoutes = require('./routes/notification');
const funnelRoutes = require('./routes/funnel');

const { sanitizeBody } = require('./middleware/sanitize');

const app = express();

// Trust one hop of reverse proxy so req.ip is the real client IP for rate limiting.
// Without this, all clients appear as 127.0.0.1 and the rate limiter blocks everyone at once.
app.set('trust proxy', 1);

// Security headers — applied before CORS so they're always present
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'"],
      styleSrc:       ["'self'", "'unsafe-inline'"],   // allow inline styles (common in Express error pages)
      imgSrc:         ["'self'", 'data:', 'https://res.cloudinary.com'],
      connectSrc:     ["'self'"],
      fontSrc:        ["'self'"],
      objectSrc:      ["'none'"],
      frameSrc:       ["'self'", 'https://res.cloudinary.com'],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow Cloudinary images from frontend
}));

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://hausfindrr.vercel.app',
  'https://hausfindrr.com',
  'https://www.hausfindrr.com',
  // Additional origins can be injected at runtime via CORS_ORIGINS env var (comma-separated)
  ...((process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean)),
];

app.use(cors({
  origin: (origin, cb) => cb(null, !origin || ALLOWED_ORIGINS.includes(origin)),
  credentials: true,
  // Expose rate-limit headers so the browser lets axios read them.
  // Without this, RateLimit-Remaining and Retry-After are blocked by CORS
  // and the login attempts counter on the frontend silently shows nothing.
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset', 'Retry-After'],
}));
app.use(express.json());
app.use(sanitizeBody);

app.use('/api/auth', authRoutes);
app.use('/api/auth', oauthRoutes);
app.use('/api/landlord', landlordRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/funnel', funnelRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/push/vapid-public-key', (req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY || null;
  res.json({ key });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return res.status(409).json({ error: `An account with that ${field} already exists` });
  }
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const { PrismaClient } = require('@prisma/client');
const _prisma = new PrismaClient();

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  console.log(`HausFindrr API running on port ${PORT}`);
  // One-time migration: occupied=true → status='rented'
  try {
    const updated = await _prisma.property.updateMany({
      where: { occupied: true, status: 'active' },
      data: { status: 'rented', occupied: false },
    });
    if (updated.count > 0) console.log(`[migrate] ${updated.count} occupied listings → rented`);
  } catch (e) {
    console.error('[migrate] occupied→rented failed:', e.message);
  }
});

// Daily 02:00 UTC — purge expired documents from Cloudinary and DB
cron.schedule('0 2 * * *', () => {
  purgeExpiredDocuments().catch(err => console.error('[docPurge] cron error:', err.message));

  // Delete read notifications older than 90 days
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  _prisma.userNotification.deleteMany({ where: { readAt: { not: null, lt: cutoff } } })
    .catch(err => console.error('[notifPurge] error:', err.message));
});
