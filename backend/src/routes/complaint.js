const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { createComplaint } = require('../controllers/complaintController');

router.post('/', authenticate, requireRole('tenant'), createComplaint);

module.exports = router;
