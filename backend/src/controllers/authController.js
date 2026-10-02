const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');
const { getOAuth2Client } = require('../services/googleFitService');

const googleScopes = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
];

function getGoogleRedirectUri() {
  return process.env.GOOGLE_AUTH_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';
}

function createOAuthState() {
  const payload = Buffer.from(JSON.stringify({ nonce: crypto.randomBytes(16).toString('hex'), issuedAt: Date.now() })).toString('base64url');
  const signature = crypto.createHmac('sha256', process.env.JWT_SECRET || 'athletix_google_oauth_state').update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function isValidOAuthState(state) {
  try {
    if (!state) return false;
    const [payload, signature] = state.split('.');
    if (!payload || !signature) return false;
    const expected = crypto.createHmac('sha256', process.env.JWT_SECRET || 'athletix_google_oauth_state').update(payload).digest('base64url');
    if (signature.length !== expected.length) return false;
    const validSignature = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    if (!validSignature) return false;
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number.isFinite(parsed.issuedAt) && Date.now() - parsed.issuedAt < 10 * 60 * 1000;
  } catch {
    return false;
  }
}

// Starts OAuth on the server so Google client secrets never reach the browser.
const googleAuthStart = (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=google_not_configured`);
  }

  const oauthClient = getOAuth2Client(getGoogleRedirectUri());
  const url = oauthClient.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: googleScopes, state: createOAuthState() });
  return res.redirect(url);
};

// Completes OAuth, links by Google ID/email, and returns the normal Athletix JWT.
const googleAuthCallback = asyncHandler(async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const { code, state } = req.query;
  if (!code) return res.redirect(`${clientUrl}/login?error=google_cancelled`);
  if (!isValidOAuthState(state)) return res.redirect(`${clientUrl}/login?error=google_state_invalid`);

  try {
    const oauthClient = getOAuth2Client(getGoogleRedirectUri());
    const { tokens } = await oauthClient.getToken(code);
    oauthClient.setCredentials(tokens);
    const ticket = await oauthClient.verifyIdToken({ idToken: tokens.id_token, audience: process.env.GOOGLE_CLIENT_ID });
    const profile = ticket.getPayload();
    if (!profile?.sub || !profile.email || !profile.email_verified) {
      throw new AppError('Google account email could not be verified.', 401);
    }

    let user = await User.findOne({ 'googleAuth.googleId': profile.sub }).select('+passwordHash');
    if (!user) user = await User.findOne({ email: profile.email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      user = new User({
        name: profile.name || profile.email.split('@')[0],
        email: profile.email.toLowerCase(),
        passwordHash: crypto.randomBytes(32).toString('hex'),
      });
    }

    user.googleAuth = {
      ...(user.googleAuth?.toObject?.() || user.googleAuth || {}),
      connected: true,
      googleId: profile.sub,
      accessToken: tokens.access_token || user.googleAuth?.accessToken || null,
      refreshToken: tokens.refresh_token || user.googleAuth?.refreshToken || null,
      expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : user.googleAuth?.expiryDate || null,
      scope: tokens.scope || user.googleAuth?.scope || null,
    };
    await user.save();

    const token = generateToken(user._id);
    return res.redirect(`${clientUrl}/oauth-callback?token=${encodeURIComponent(token)}`);
  } catch (error) {
    console.error('[Auth] Google OAuth failed:', error.message);
    return res.redirect(`${clientUrl}/login?error=google_failed`);
  }
});

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new AppError('An account with this email already exists.', 409);

  // passwordHash field gets hashed by the User model's pre-save hook
  const user = await User.create({ name, email, passwordHash: password });

  const token = generateToken(user._id);
  res.status(201).json({ success: true, token, user: user.toSafeObject() });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) throw new AppError('Invalid email or password.', 401);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError('Invalid email or password.', 401);

  const token = generateToken(user._id);
  res.json({ success: true, token, user: user.toSafeObject() });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

module.exports = { register, login, getMe, googleAuthStart, googleAuthCallback };
