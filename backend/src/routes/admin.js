const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  getPendingLandlords, verifyLandlord,
  getPendingProperties, reviewProperty,
  getAllLandlords, getAllListings,
} = require('../controllers/adminController');

router.use(authenticate, requireRole('admin'));

router.get('/landlords/pending', getPendingLandlords);
router.patch('/landlords/:id/verify', verifyLandlord);
router.get('/landlords', getAllLandlords);

router.get('/properties/pending', getPendingProperties);
router.patch('/properties/:id/review', reviewProperty);
router.get('/properties', getAllListings);

module.exports = router;
