const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { documentUpload } = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');
const { registerLandlord, registerTenant, login, me, acceptTerms } = require('../controllers/authController');
const { verifyTwoFactor } = require('../controllers/twoFactorController');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  skipSuccessfulRequests: true,
});

router.post(
  '/register/landlord',
  documentUpload.fields([{ name: 'id_document', maxCount: 1 }]),
  registerLandlord
);
router.post('/register/tenant', registerTenant);
router.post('/login', loginLimiter, login);
router.post('/2fa/verify', verifyTwoFactor);
router.get('/me', authenticate, me);
router.patch('/accept-terms', authenticate, acceptTerms);

module.exports = router;
