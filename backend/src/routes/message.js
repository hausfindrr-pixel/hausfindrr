const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { sendMessage, getThread, getInbox } = require('../controllers/messageController');

router.use(authenticate);

router.post('/', sendMessage);
router.get('/inbox', getInbox);
router.get('/:propertyId/:otherUserId', getThread);

module.exports = router;
