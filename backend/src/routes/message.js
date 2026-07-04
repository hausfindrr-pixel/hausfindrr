const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  sendMessage, sendDirectMessage,
  getThread, getDirectThread,
  markRead, markDirectRead,
  getInbox,
} = require('../controllers/messageController');

router.use(authenticate);

router.post('/', sendMessage);
router.get('/inbox', getInbox);

// Direct (no-property) message threads — must come before /:propertyId routes
router.get('/direct/:otherUserId', getDirectThread);
router.patch('/direct/:otherUserId/read', markDirectRead);

// Property-specific threads
router.get('/:propertyId/:otherUserId', getThread);
router.patch('/:propertyId/:otherUserId/read', markRead);

module.exports = router;
