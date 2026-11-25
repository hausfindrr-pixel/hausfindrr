const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { toggleFavorite, getFavorites } = require('../controllers/tenantController');
const { createDataRequest } = require('../controllers/dataRequestController');

router.use(authenticate, requireRole('tenant'));

router.post('/favorite/:propertyId', toggleFavorite);
router.get('/favorites', getFavorites);
router.post('/data-request', createDataRequest);

module.exports = router;
