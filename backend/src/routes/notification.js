const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getMyNotifications, markRead } = require('../controllers/notificationController');

router.use(authenticate);
router.get('/', getMyNotifications);
router.patch('/:id/read', markRead);

module.exports = router;
