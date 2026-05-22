import { Router } from 'express';

const router = Router();

const SITE_KEY   = '6LdAefcsAAAAAFYK74a9iG6gRxH3YGI6p32DqW12';
const PROJECT_ID = 'workbee-497116';
const API_KEY    = process.env.RECAPTCHA_API_KEY;

router.post('/verify', async (req, res) => {
  const { token, action } = req.body;

  if (!token) return res.status(400).json({ success: false, error: 'Missing token' });

  // If no API key configured, allow through (dev/unconfigured environments)
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
    const score = data?.riskAnalysis?.score ?? data?.score ?? 0;
    const valid = data?.tokenProperties?.valid ?? false;

    if (!valid || score < 0.5) {
      return res.status(403).json({ success: false, score, error: 'reCAPTCHA check failed' });
    }

    res.json({ success: true, score });
  } catch (err) {
    // Fail open — don't block users if Google API is unreachable
    console.error('reCAPTCHA verify error:', err.message);
    res.json({ success: true, score: null });
  }
});

export default router;
