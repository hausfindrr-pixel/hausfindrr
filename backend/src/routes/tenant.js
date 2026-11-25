const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { toggleFavorite, isFavorited, getFavorites } = require('../controllers/tenantController');
const { createDataRequest } = require('../controllers/dataRequestController');

router.use(authenticate, requireRole('tenant'));

router.post('/favorite/:propertyId', toggleFavorite);
router.get('/favorite/:propertyId', isFavorited);
router.get('/favorites', getFavorites);
router.post('/data-request', createDataRequest);

module.exports = router;
