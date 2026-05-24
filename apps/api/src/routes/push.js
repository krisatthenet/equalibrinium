import express from 'express';
import PocketBase from 'pocketbase';
import { sendPushToUser } from '../utils/webpush.js';
import logger from '../utils/logger.js';

const router = express.Router();
const PB_URL = process.env.POCKETBASE_URL || 'https://workbee-pocketbase-cayj-production.up.railway.app';

async function adminPb() {
  const pb = new PocketBase(PB_URL);
  await pb.collection('_superusers').authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL,
    process.env.POCKETBASE_ADMIN_PASSWORD
  );
  return pb;
}

// GET /push/vapid-public-key — return public VAPID key to frontend
router.get('/vapid-public-key', (req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) return res.status(500).json({ error: 'VAPID not configured' });
  res.json({ publicKey: key });
});

// POST /push/subscribe — save a push subscription for a user
router.post('/subscribe', async (req, res) => {
  const { userId, subscription } = req.body;
  if (!userId || !subscription?.endpoint) {
    return res.status(400).json({ error: 'userId and subscription required' });
  }

  try {
    const pb = await adminPb();

    // Avoid duplicates — update if endpoint already exists for this user
    const existing = await pb.collection('push_subscriptions').getList(1, 1, {
      filter: `userId = "${userId}" && endpoint = "${subscription.endpoint}"`,
    });

    if (existing.items.length > 0) {
      await pb.collection('push_subscriptions').update(existing.items[0].id, {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      });
    } else {
      await pb.collection('push_subscriptions').create({
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      });
    }

    logger.info('Push subscription saved', 'userId', userId);
    res.json({ ok: true });
  } catch (err) {
    logger.error('subscribe error', 'error', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /push/unsubscribe — remove subscription
router.delete('/unsubscribe', async (req, res) => {
  const { userId, endpoint } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const pb = await adminPb();
    const filter = endpoint
      ? `userId = "${userId}" && endpoint = "${endpoint}"`
      : `userId = "${userId}"`;
    const subs = await pb.collection('push_subscriptions').getFullList({ filter });
    await Promise.all(subs.map((s) => pb.collection('push_subscriptions').delete(s.id)));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /push/notify — internal endpoint called by PocketBase hooks
router.post('/notify', async (req, res) => {
  const secret = req.headers['x-internal-secret'];
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { userId, title, body, url } = req.body;
  if (!userId || !title) return res.status(400).json({ error: 'userId and title required' });

  await sendPushToUser(userId, { title, body, url });
  res.json({ ok: true });
});

export default router;
