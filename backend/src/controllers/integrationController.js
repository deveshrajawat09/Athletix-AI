const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const crypto = require('crypto');
const User = require('../models/User');
const Workout = require('../models/Workout');
const { syncGoogleFitData } = require('../services/googleFitService');
const { syncWorkoutToGoogleCalendar } = require('../services/googleCalendarService');
const { sendWorkoutSummaryEmail, sendDailyBriefingEmail } = require('../services/emailService');
const agentService = require('../services/agentService');
const { getOAuth2Client } = require('../services/googleFitService');

const googleFitScopes = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
];

function googleIntegrationRedirectUri() {
  return process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/integrations/google/callback';
}

function makeGoogleIntegrationState(userId) {
  const payload = Buffer.from(JSON.stringify({ userId: String(userId), issuedAt: Date.now() })).toString('base64url');
  const signature = crypto.createHmac('sha256', process.env.JWT_SECRET || 'athletix_google_integration_state').update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function readGoogleIntegrationState(state) {
  try {
    const [payload, signature] = String(state || '').split('.');
    const expected = crypto.createHmac('sha256', process.env.JWT_SECRET || 'athletix_google_integration_state').update(payload).digest('base64url');
    if (!payload || !signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Date.now() - parsed.issuedAt < 10 * 60 * 1000 ? parsed : null;
  } catch {
    return null;
  }
}

// GET /api/integrations/google/oauth
const startGoogleFitOAuth = (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${clientUrl}/profile?google=not_configured`);
  }
  const oauthClient = getOAuth2Client(googleIntegrationRedirectUri());
  const url = oauthClient.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: googleFitScopes,
    state: makeGoogleIntegrationState(req.user._id),
  });
  return res.redirect(url);
};

// GET /api/integrations/google/callback
const googleFitOAuthCallback = asyncHandler(async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const state = readGoogleIntegrationState(req.query.state);
  if (!state || !req.query.code) return res.redirect(`${clientUrl}/profile?google=failed`);

  try {
    const oauthClient = getOAuth2Client(googleIntegrationRedirectUri());
    const { tokens } = await oauthClient.getToken(req.query.code);
    const user = await User.findById(state.userId);
    if (!user) return res.redirect(`${clientUrl}/profile?google=failed`);

    user.googleAuth = {
      ...(user.googleAuth?.toObject?.() || user.googleAuth || {}),
      connected: true,
      accessToken: tokens.access_token || user.googleAuth?.accessToken || null,
      refreshToken: tokens.refresh_token || user.googleAuth?.refreshToken || null,
      expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : user.googleAuth?.expiryDate || null,
      scope: tokens.scope || user.googleAuth?.scope || null,
    };
    await user.save();
    await syncGoogleFitData(user._id);
    return res.redirect(`${clientUrl}/profile?google=connected`);
  } catch (error) {
    console.error('[GoogleFit] OAuth callback failed:', error.message);
    return res.redirect(`${clientUrl}/profile?google=failed`);
  }
});

/**
 * GET /api/integrations/status
 * Get status of user integrations and automation preferences
 */
const getIntegrationStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({
    success: true,
    googleAuth: {
      connected: !!user.googleAuth?.connected,
      lastFitSyncAt: user.googleAuth?.lastFitSyncAt || null,
    },
    automationPreferences: user.automationPreferences || {
      autoFitSync: true,
      autoCalendarSync: true,
      emailWorkoutSummary: true,
      emailDailyBriefing: true,
      notificationEmail: user.email,
    },
  });
});

/**
 * PUT /api/integrations/preferences
 * Update automation settings (auto sync, email notifications, etc.)
 */
const updatePreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.automationPreferences = {
    ...user.automationPreferences,
    ...req.body,
  };
  await user.save();
  res.json({ success: true, automationPreferences: user.automationPreferences });
});

/**
 * POST /api/integrations/google/connect
 * Connect Google account (real token or simulated dev connection)
 */
const connectGoogleAccount = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, expiryDate, simulate } = req.body;
  const user = await User.findById(req.user._id);

  user.googleAuth = {
    ...(user.googleAuth?.toObject?.() || user.googleAuth || {}),
    connected: true,
    accessToken: accessToken || (simulate ? 'simulated_dev_token' : null),
    refreshToken: refreshToken || null,
    expiryDate: expiryDate ? new Date(expiryDate) : null,
    lastFitSyncAt: new Date(),
  };
  await user.save();

  // Initial step sync right after connecting
  const fitSync = await syncGoogleFitData(user._id);

  res.json({
    success: true,
    message: 'Google Fit & Calendar connected successfully!',
    fitSync,
    googleAuth: {
      connected: true,
      lastFitSyncAt: user.googleAuth.lastFitSyncAt,
    },
  });
});

/**
 * POST /api/integrations/google/disconnect
 * Disconnect Google account
 */
const disconnectGoogleAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.googleAuth = { connected: false, accessToken: null, refreshToken: null, lastFitSyncAt: null };
  await user.save();
  res.json({ success: true, message: 'Google account disconnected.' });
});

/**
 * POST /api/integrations/google-fit/sync
 * Manually trigger Google Fit real-time step and fitness sync
 */
const syncGoogleFit = asyncHandler(async (req, res) => {
  const result = await syncGoogleFitData(req.user._id, { stepDelta: req.body?.stepDelta });
  res.json(result);
});

/**
 * POST /api/integrations/google-calendar/sync-workout
 * Sync a workout session into Google Calendar
 */
const syncCalendarWorkout = asyncHandler(async (req, res) => {
  const { workoutId } = req.body;
  if (!workoutId) throw new AppError('workoutId is required', 400);

  const result = await syncWorkoutToGoogleCalendar(req.user._id, workoutId);
  res.json(result);
});

/**
 * POST /api/integrations/email/send-summary
 * Send workout summary email
 */
const sendSummaryEmail = asyncHandler(async (req, res) => {
  const { workoutId } = req.body;
  if (!workoutId) throw new AppError('workoutId is required', 400);

  const result = await sendWorkoutSummaryEmail(req.user._id, workoutId);
  res.json(result);
});

/**
 * POST /api/integrations/email/send-daily-briefing
 * Send morning daily briefing email
 */
const triggerDailyBriefingEmail = asyncHandler(async (req, res) => {
  const result = await sendDailyBriefingEmail(req.user._id);
  res.json(result);
});

module.exports = {
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
};
