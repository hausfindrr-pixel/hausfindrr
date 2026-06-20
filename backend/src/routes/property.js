const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { photoUpload } = require('../middleware/upload');
const { createProperty, getListings, getProperty, getLandlordProperties } = require('../controllers/propertyController');

// Public / tenant browse (auth optional for masking)
router.get('/', (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth) {
    const jwt = require('jsonwebtoken');
    try {
      req.user = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    } catch {}
  }
  next();
}, getListings);

router.get('/my', authenticate, requireRole('landlord'), getLandlordProperties);

router.get('/:id', (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth) {
    const jwt = require('jsonwebtoken');
    try {
      req.user = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    } catch {}
  }
  next();
}, getProperty);

router.post(
  '/',
  authenticate,
  requireRole('landlord'),
  photoUpload.array('photos', 20),
  createProperty
);

module.exports = router;
