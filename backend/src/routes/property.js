const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { photoUpload, propertyUpload } = require('../middleware/upload');
const {
  createProperty, updateProperty, getListings, getProperty,
  getLandlordProperties, deleteProperty, toggleOccupied, markSold,
} = require('../controllers/propertyController');

// Optional auth middleware for public routes
function optionalAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (auth) {
    const jwt = require('jsonwebtoken');
    try {
      req.user = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    } catch {}
  }
  next();
}

// Public / tenant browse (auth optional for masking)
router.get('/', optionalAuth, getListings);

router.get('/my', authenticate, requireRole('landlord'), getLandlordProperties);

router.get('/:id', optionalAuth, getProperty);

router.post(
  '/',
  authenticate,
  requireRole('landlord'),
  propertyUpload.fields([
    { name: 'photos', maxCount: 20 },
    { name: 'title_documents', maxCount: 5 },
  ]),
  createProperty
);

router.put(
  '/:id',
  authenticate,
  requireRole('landlord'),
  propertyUpload.fields([
    { name: 'photos', maxCount: 20 },
    { name: 'title_documents', maxCount: 5 },
  ]),
  updateProperty
);

// Occupied toggle (rental listings only)
router.patch('/:id/occupied', authenticate, requireRole('landlord'), toggleOccupied);

// Mark as sold (sale listings only)
router.patch('/:id/sold', authenticate, requireRole('landlord'), markSold);

// Delete — landlord deletes own, admin deletes any
router.delete('/:id', authenticate, deleteProperty);

module.exports = router;
