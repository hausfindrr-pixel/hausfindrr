const express = require('express');
const router = express.Router();
const { initiateGoogleAuth, googleCallback, googleComplete } = require('../controllers/oauthController');

router.get('/google', initiateGoogleAuth);
router.get('/google/callback', googleCallback);
router.post('/google/complete', googleComplete);

module.exports = router;
