import { Router } from 'express';
import logger from '../utils/logger.js';

const router = Router();

const SITE_KEY   = '6LdAefcsAAAAAFYK74a9iG6gRxH3YGI6p32DqW12';
const PROJECT_ID = 'workbee-497116';
const API_KEY    = process.env.RECAPTCHA_API_KEY;

router.post('/verify', async (req, res) => {
  const { token, action } = req.body;

  if (!token) return res.status(400).json({ success: false, error: 'Missing token' });

  if (!API_KEY) return res.json({ success: true, score: 1 });

  try {
    const response = await fetch(
      `https://recaptchaenterprise.googleapis.com/v1/projects/${PROJECT_ID}/assessments?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: { token, expectedAction: action, siteKey: SITE_KEY },
        }),
      }
    );

    const data = await response.json();

    // Google returns an error object when the API key is invalid/unauthorized
    if (data?.error) {
      logger.error('reCAPTCHA Enterprise API error:', JSON.stringify(data.error));
      // Fail open — misconfigured API key should not block users
      return res.json({ success: true, score: null });
    }

    const score = data?.riskAnalysis?.score ?? 0;
    const valid = data?.tokenProperties?.valid ?? false;
    const invalidReason = data?.tokenProperties?.invalidReason;

    // Log suspicious signals for monitoring but never block — reCAPTCHA is a soft
    // signal and invalid tokens (expired, action mismatch) are common for real users.
    if (!valid) {
      logger.warn(`reCAPTCHA token invalid (fail open): reason=${invalidReason}, action=${action}`);
      return res.json({ success: true, score: null });
    }

    if (score < 0.5) {
      logger.warn(`reCAPTCHA low score (fail open): score=${score}, action=${action}`);
    }

    res.json({ success: true, score });
  } catch (err) {
    logger.error('reCAPTCHA verify error:', err);
    res.json({ success: true, score: null });
  }
});

export default router;
