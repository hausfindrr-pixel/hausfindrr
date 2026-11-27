const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getMyNotifications, getUnreadCount,
  markRead, markAllRead,
  subscribePush, unsubscribePush,
  getNotificationSettings, updateNotificationSettings,
} = require('../controllers/notificationController');

router.use(authenticate);

router.get('/',              getMyNotifications);
router.get('/unread-count',  getUnreadCount);
router.patch('/:id/read',    markRead);
router.patch('/read-all',    markAllRead);

router.post('/push/subscribe',   subscribePush);
router.post('/push/unsubscribe', unsubscribePush);

router.get('/settings',    getNotificationSettings);
router.patch('/settings',  updateNotificationSettings);

module.exports = router;
