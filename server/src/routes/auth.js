const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../db');
const router = express.Router();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || '';

const SCOPES = 'openid email profile';
const COOKIE = 'av_token';
const STATE_COOKIE = 'av_oauth_state';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
const IS_PROD = process.env.NODE_ENV === 'production';

function configured() {
  return Boolean(CLIENT_ID && CLIENT_SECRET && JWT_SECRET);
}

const cookieOptions = () => ({
  httpOnly: true,
  // The deployed frontend (Netlify) and API (Render) are different sites, so the
  // session cookie must be sent cross-site: SameSite=None + Secure (prod only).
  // Locally everything is on localhost, where 'lax' is correct.
  sameSite: IS_PROD ? 'none' : 'lax',
  secure: IS_PROD,
  path: '/',
});

// ---------- Start the Google OAuth flow ----------
// GET /api/auth/google
router.get('/google', (req, res) => {
  if (!configured()) {
    return res.status(503).json({
      error:
        'Google login is not configured yet. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and JWT_SECRET to server/.env, then restart the API.',
    });
  }
  // Anti-CSRF: a random state token, kept in an httpOnly cookie and verified on return
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie(STATE_COOKIE, state, { ...cookieOptions(), maxAge: 10 * 60 * 1000 });

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'online',
    prompt: 'select_account',
    state,
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// ---------- Google redirects here after the user signs in ----------
// GET /api/auth/google/callback
router.get('/google/callback', async (req, res) => {
  const { code, error, state } = req.query;

  // Verify the anti-CSRF state token before doing anything else
  const expectedState = req.cookies && req.cookies[STATE_COOKIE];
  // Match the attributes the cookie was set with, or the clear can be ignored by browsers
  res.clearCookie(STATE_COOKIE, cookieOptions());
  if (error || !code || !expectedState || !state || state !== expectedState) {
    return res.redirect(`${FRONTEND_URL}/?auth=error`);
  }
  if (!configured()) {
    return res.status(503).json({ error: 'Google login is not configured yet.' });
  }
  try {
    // 1) Exchange the authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: CALLBACK_URL,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokenRes.ok || !tokens.access_token) {
      console.error('Google token exchange failed:', tokens.error || tokens.error_description || tokens);
      return res.redirect(`${FRONTEND_URL}/?auth=error`);
    }

    // 2) Fetch the profile (id, email, name, picture)
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json();
    // Reject unverified emails to prevent account confusion
    if (!profileRes.ok || !profile.email || !profile.sub || profile.email_verified !== true) {
      console.error('Google profile fetch failed:', profile.error_description || profile.error || 'invalid profile');
      return res.redirect(`${FRONTEND_URL}/?auth=error`);
    }

    // 3) Upsert the user (atomic — safe under concurrent callbacks)
    await query(
      `INSERT INTO users (google_id, email, name, picture, last_login)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), email = VALUES(email), picture = VALUES(picture), last_login = NOW()`,
      [profile.sub, profile.email, profile.name || profile.email, profile.picture || null]
    );
    const userRows = await query('SELECT id FROM users WHERE google_id = ?', [profile.sub]);
    const userId = userRows[0]?.id;
    if (!userId) throw new Error('User record missing after upsert');

    // 4) Issue a JWT session in an httpOnly cookie
    const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie(COOKIE, token, { ...cookieOptions(), maxAge: COOKIE_MAX_AGE });
    res.redirect(`${FRONTEND_URL}/?auth=success`);
  } catch (err) {
    console.error('Google callback failed:', err);
    res.redirect(`${FRONTEND_URL}/?auth=error`);
  }
});

// ---------- Current user (or 401) ----------
// GET /api/auth/me
router.get('/me', async (req, res) => {
  if (!configured()) return res.status(401).json({ user: null });
  const token = req.cookies && req.cookies[COOKIE];
  if (!token) return res.status(401).json({ user: null });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const rows = await query(
      'SELECT id, google_id, email, name, picture, created_at FROM users WHERE id = ?',
      [payload.sub]
    );
    if (!rows.length) return res.status(401).json({ user: null });
    res.json({ user: rows[0] });
  } catch {
    res.status(401).json({ user: null });
  }
});

// ---------- Logout ----------
// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE, cookieOptions());
  res.json({ ok: true });
});

// Middleware: require a logged-in user (for protected routes later)
async function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies[COOKIE];
  if (!token) return res.status(401).json({ error: 'You must be signed in.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const rows = await query('SELECT id, email, name, picture FROM users WHERE id = ?', [payload.sub]);
    if (!rows.length) return res.status(401).json({ error: 'Session expired.' });
    req.user = rows[0];
    next();
  } catch {
    res.status(401).json({ error: 'Invalid session.' });
  }
}

module.exports = router;
module.exports.requireAuth = requireAuth;
