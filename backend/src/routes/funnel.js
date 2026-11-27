const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { recordEvent } = require('../controllers/funnelController');

const funnelLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
  skipSuccessfulRequests: false,
});

router.post('/event', funnelLimiter, recordEvent);

module.exports = router;
