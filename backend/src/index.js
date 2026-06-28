require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const authRoutes = require('./routes/auth');
const landlordRoutes = require('./routes/landlord');
const tenantRoutes = require('./routes/tenant');
const adminRoutes = require('./routes/admin');
const propertyRoutes = require('./routes/property');
const messageRoutes = require('./routes/message');
const complaintRoutes = require('./routes/complaint');
const announcementRoutes = require('./routes/announcement');

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
}));
app.use(express.json());
app.use(sanitizeBody);

app.use('/api/auth', authRoutes);
app.use('/api/landlord', landlordRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/announcements', announcementRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return res.status(409).json({ error: `An account with that ${field} already exists` });
  }
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`HausFindrr API running on port ${PORT}`));
