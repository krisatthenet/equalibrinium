import express from 'express';
import { authenticateUser, registerUser } from '../utils/pocketbase.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required',
    });
  }

  logger.info(`User registration attempt for email: ${email}`);

  // Register user - throw Error so errorMiddleware catches it
  const result = await registerUser(email, password, name || '');

  logger.info(`User registered successfully: ${email}`);

  res.status(201).json({
    token: result.token,
    user: result.user,
  });
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