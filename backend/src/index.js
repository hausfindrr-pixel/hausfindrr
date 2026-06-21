require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const landlordRoutes = require('./routes/landlord');
const tenantRoutes = require('./routes/tenant');
const adminRoutes = require('./routes/admin');
const propertyRoutes = require('./routes/property');
const messageRoutes = require('./routes/message');

const app = express();

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://hausfindrr.vercel.app',
];

app.use(cors({
  origin: (origin, cb) => cb(null, !origin || ALLOWED_ORIGINS.includes(origin)),
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/landlord', landlordRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/messages', messageRoutes);

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
