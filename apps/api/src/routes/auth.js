import express from 'express';
import { authenticateUser } from '../utils/pocketbase.js';
import logger from '../utils/logger.js';

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

export default router;