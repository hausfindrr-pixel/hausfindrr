const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  getPendingLandlords, verifyLandlord,
  getPendingProperties, reviewProperty,
  getAllLandlords, getAllListings,
  getAnalytics,
  getAllMessages,
  suspendLandlord,
  deleteLandlord,
} = require('../controllers/adminController');
const { setupTwoFactor, confirmTwoFactor, disableTwoFactor } = require('../controllers/twoFactorController');
const { createAnnouncement, getAdminAnnouncements } = require('../controllers/announcementController');
const { getComplaints, updateComplaintStatus } = require('../controllers/complaintController');
const { sendDirectMessage } = require('../controllers/messageController');
const { getConsentLogs } = require('../controllers/consentController');

router.use(authenticate, requireRole('admin'));

router.get('/landlords/pending', getPendingLandlords);
router.patch('/landlords/:id/verify', verifyLandlord);
router.patch('/landlords/:id/suspend', suspendLandlord);
router.delete('/landlords/:id', deleteLandlord);
router.get('/landlords', getAllLandlords);

router.get('/properties/pending', getPendingProperties);
router.patch('/properties/:id/review', reviewProperty);
router.get('/properties', getAllListings);

router.get('/analytics', getAnalytics);
router.get('/messages', getAllMessages);

router.post('/announcements', createAnnouncement);
router.get('/announcements', getAdminAnnouncements);

router.post('/direct-message', sendDirectMessage);

router.get('/complaints', getComplaints);
router.patch('/complaints/:id/status', updateComplaintStatus);

router.get('/consent-logs', getConsentLogs);

router.get('/2fa/setup', setupTwoFactor);
router.post('/2fa/confirm', confirmTwoFactor);
router.post('/2fa/disable', disableTwoFactor);

module.exports = router;
