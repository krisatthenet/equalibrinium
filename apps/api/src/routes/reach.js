import express from 'express';
import { getPocketBase } from '../utils/pocketbase.js';
import logger from '../utils/logger.js';

const router = express.Router();

const REACH_API = 'https://developers.hostinger.com/api/reach/v1';
const REACH_PROFILE_UUID = process.env.HOSTINGER_REACH_PROFILE_UUID;
const REACH_API_KEY = process.env.HOSTINGER_API_KEY;

/**
 * POST /reach/subscribe
 * Adds a lead to Hostinger Reach contacts + PocketBase leads collection.
 * Body: { name, email, source? }
 */
router.post('/subscribe', async (req, res) => {
  const { name, email, source = 'homepage_popup' } = req.body;

  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ error: 'name and email are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const cleanName  = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const [firstName, ...rest] = cleanName.split(' ');
  const surname = rest.join(' ') || '';

  const results = await Promise.allSettled([
    // 1 — Hostinger Reach
    REACH_API_KEY && REACH_PROFILE_UUID
      ? fetch(`${REACH_API}/profiles/${REACH_PROFILE_UUID}/contacts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${REACH_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: firstName, surname, email: cleanEmail }),
        }).then(r => r.json())
      : Promise.resolve({ skipped: true }),

    // 2 — PocketBase leads
    getPocketBase().collection('leads').create({ name: cleanName, email: cleanEmail, source }),
  ]);

  const [reachResult, pbResult] = results;

  if (reachResult.status === 'rejected') logger.warn('Reach subscribe failed:', reachResult.reason);
  if (pbResult.status === 'rejected')   logger.warn('PocketBase lead save failed:', pbResult.reason);

  if (pbResult.status === 'rejected' && reachResult.status === 'rejected') {
    return res.status(500).json({ error: 'Subscription failed' });
  }

  logger.info(`Lead subscribed: ${cleanEmail}`);
  res.status(201).json({ ok: true });
});

export default router;
