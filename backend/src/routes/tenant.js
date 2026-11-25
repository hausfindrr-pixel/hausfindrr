const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { toggleFavorite, getFavorites } = require('../controllers/tenantController');

router.use(authenticate, requireRole('tenant'));

router.post('/favorite/:propertyId', toggleFavorite);
router.get('/favorites', getFavorites);

module.exports = router;
