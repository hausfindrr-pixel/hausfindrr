const express = require('express');
const router = express.Router();
const { documentUpload } = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');
const { registerLandlord, registerTenant, login, me } = require('../controllers/authController');

router.post(
  '/register/landlord',
  documentUpload.fields([
    { name: 'passport_nid', maxCount: 2 },
    { name: 'title_document', maxCount: 3 },
    { name: 'supporting_docs', maxCount: 5 },
  ]),
  registerLandlord
);
router.post('/register/tenant', registerTenant);
router.post('/login', login);
router.get('/me', authenticate, me);

module.exports = router;
