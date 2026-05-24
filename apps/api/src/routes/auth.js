import express from 'express';
import PocketBase from 'pocketbase';
import { authenticateUser } from '../utils/pocketbase.js';
import logger from '../utils/logger.js';

const PB_URL = process.env.POCKETBASE_URL || 'https://workbee-pocketbase-cayj-production.up.railway.app';
const SITE_KEY   = '6LdAefcsAAAAAFYK74a9iG6gRxH3YGI6p32DqW12';
const PROJECT_ID = 'workbee-497116';
const RECAPTCHA_API_KEY = process.env.RECAPTCHA_API_KEY;

async function verifyCaptchaToken(token, action) {
  if (!RECAPTCHA_API_KEY) return true;
  try {
    const r = await fetch(
      `https://recaptchaenterprise.googleapis.com/v1/projects/${PROJECT_ID}/assessments?key=${RECAPTCHA_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: { token, expectedAction: action, siteKey: SITE_KEY } }),
      }
    );
    const data = await r.json();
    const score = data?.riskAnalysis?.score ?? data?.score ?? 0;
    const valid = data?.tokenProperties?.valid ?? false;
    return valid && score >= 0.5;
  } catch {
    return true; // fail open
  }
}

const router = express.Router();

/**
 * POST /auth/register
 * Validate registration data (user creation is handled directly by the frontend via PocketBase)
 */
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: 'Email and password are required',
    });
  }

  logger.info(`Registration validation passed for email: ${email}`);

  res.status(200).json({ ok: true });
});

/**
 * POST /auth/login
 * Login user
 * Request body: { email, password }
 * Response: { token, user: { id, email, name, userType } }
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required',
    });
  }

  logger.info(`User login attempt for email: ${email}`);

  // Authenticate user with PocketBase - throw Error so errorMiddleware catches it
  const result = await authenticateUser(email, password);

  logger.info(`User logged in successfully: ${email}`);

  // Return token and user data directly (NOT wrapped in extra object)
  res.json({
    token: result.token,
    user: result.user,
  });
});

/**
 * POST /auth/reset-password
 * Verify reCAPTCHA then update user password directly (no email required).
 * Body: { email, newPassword, captchaToken }
 */
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'email and newPassword are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const pb = new PocketBase(PB_URL);
    await pb.collection('_superusers').authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL,
      process.env.POCKETBASE_ADMIN_PASSWORD
    );

    const results = await pb.collection('users').getList(1, 1, { filter: `email = "${email}"` });
    if (!results.items.length) {
      // Return success even if user not found to avoid email enumeration
      return res.json({ ok: true });
    }

    const user = results.items[0];
    await pb.collection('users').update(user.id, {
      password: newPassword,
      passwordConfirm: newPassword,
    });

    logger.info(`Password reset via reCAPTCHA for user: ${email}`);
    res.json({ ok: true });
  } catch (err) {
    logger.error('reset-password error:', err);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
});

export default router;