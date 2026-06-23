const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  getPendingLandlords, verifyLandlord,
  getPendingProperties, reviewProperty,
  getAllLandlords, getAllListings,
  getAnalytics,
  getAllTransactions,
  getAllMessages,
  suspendLandlord,
  deleteLandlord,
} = require('../controllers/adminController');

router.use(authenticate, requireRole('admin'));

router.get('/landlords/pending', getPendingLandlords);
router.patch('/landlords/:id/verify', verifyLandlord);
router.patch('/landlords/:id/suspend', suspendLandlord);
router.delete('/landlords/:id', deleteLandlord);
router.get('/landlords', getAllLandlords);

router.get('/properties/pending', getPendingProperties);
router.patch('/properties/:id/review', reviewProperty);
router.get('/properties', getAllListings);

router.get('/analytics', getAnalytics);
router.get('/transactions', getAllTransactions);
router.get('/messages', getAllMessages);

module.exports = router;
