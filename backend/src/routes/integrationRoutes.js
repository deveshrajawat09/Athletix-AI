const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getIntegrationStatus,
  startGoogleFitOAuth,
  googleFitOAuthCallback,
  updatePreferences,
  connectGoogleAccount,
  disconnectGoogleAccount,
  syncGoogleFit,
  syncCalendarWorkout,
  sendSummaryEmail,
  triggerDailyBriefingEmail,
} = require('../controllers/integrationController');

const router = express.Router();

// Google redirects here without the app's Bearer token; the signed OAuth state identifies the user.
router.get('/google/callback', googleFitOAuthCallback);

router.use(protect);

router.get('/status', getIntegrationStatus);
router.get('/google/oauth', startGoogleFitOAuth);
router.put('/preferences', updatePreferences);
router.post('/google/connect', connectGoogleAccount);
router.post('/google/disconnect', disconnectGoogleAccount);
router.post('/google-fit/sync', syncGoogleFit);
router.post('/google-calendar/sync-workout', syncCalendarWorkout);
router.post('/email/send-summary', sendSummaryEmail);
router.post('/email/send-daily-briefing', triggerDailyBriefingEmail);

module.exports = router;
