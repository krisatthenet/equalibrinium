import express from 'express';
import { getPocketBase } from '../utils/pocketbase.js';
import { verifyRecaptchaToken } from '../utils/recaptcha.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /contacts
 * Create a contact message with reCaptcha validation
 * Request body: { name, email, subject, message, recaptchaToken, category? }
 * Response: { message, contactId, name, email, recaptchaScore }
 */
router.post('/', async (req, res) => {
  const { name, email, subject, message, recaptchaToken, category } = req.body;

  // Validate required fields
  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      error: 'Name, email, subject, and message are required',
    });
  }

  if (!recaptchaToken) {
    return res.status(400).json({
      error: 'reCaptcha token is required',
    });
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'Invalid email address',
    });
  }

  // Validate category if provided
  const validCategories = ['General', 'Support', 'Partnership', 'Other'];
  if (category && !validCategories.includes(category)) {
    return res.status(400).json({
      error: `category must be one of: ${validCategories.join(', ')}`,
    });
  }

  logger.info(`Contact message submission attempt from ${email}`);

  // Verify reCaptcha token - throws if verification fails internally
  const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, 'contact');

  if (!recaptchaResult.valid) {
    return res.status(400).json({
      error: 'Security verification failed. Please try again.',
    });
  }

  // Save contact to PocketBase
  const pb = getPocketBase();

  const contactData = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    subject: subject.trim(),
    message: message.trim(),
    ...(category && { category }),
  };

  const record = await pb.collection('contacts').create(contactData);

  logger.info(`Contact message saved (id: ${record.id}) from ${email} (reCaptcha score: ${recaptchaResult.score})`);

  res.status(201).json({
    message: 'Contact message received successfully',
    contactId: record.id,
    name: record.name,
    email: record.email,
    recaptchaScore: recaptchaResult.score,
  });
});

export default router;
