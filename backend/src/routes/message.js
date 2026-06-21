const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { sendMessage, getThread, markRead, getInbox } = require('../controllers/messageController');

router.use(authenticate);

router.post('/', sendMessage);
router.get('/inbox', getInbox);
router.get('/:propertyId/:otherUserId', getThread);
router.patch('/:propertyId/:otherUserId/read', markRead);

module.exports = router;
