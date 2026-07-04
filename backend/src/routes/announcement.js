const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getMyAnnouncements } = require('../controllers/announcementController');

router.get('/', authenticate, getMyAnnouncements);

module.exports = router;
