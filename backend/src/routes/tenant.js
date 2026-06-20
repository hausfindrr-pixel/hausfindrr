const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { unlockProperty, getUnlockedProperties, toggleFavorite, getFavorites } = require('../controllers/tenantController');

router.use(authenticate, requireRole('tenant'));

router.post('/unlock/:propertyId', unlockProperty);
router.get('/unlocked', getUnlockedProperties);
router.post('/favorite/:propertyId', toggleFavorite);
router.get('/favorites', getFavorites);

module.exports = router;
