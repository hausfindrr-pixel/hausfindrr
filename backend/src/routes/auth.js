const express = require('express');
const router = express.Router();
const { documentUpload } = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');
const { registerLandlord, registerTenant, login, me, acceptTerms } = require('../controllers/authController');

router.post(
  '/register/landlord',
  documentUpload.fields([{ name: 'id_document', maxCount: 1 }]),
  registerLandlord
);
router.post('/register/tenant', registerTenant);
router.post('/login', login);
router.get('/me', authenticate, me);
router.patch('/accept-terms', authenticate, acceptTerms);

module.exports = router;
