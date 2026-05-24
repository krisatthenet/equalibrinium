import webpush from 'web-push';
import PocketBase from 'pocketbase';
import logger from './logger.js';

const PB_URL = process.env.POCKETBASE_URL || 'https://workbee-pocketbase-cayj-production.up.railway.app';

const vapidConfigured = process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY;
if (vapidConfigured) {
  webpush.setVapidDetails(
    'mailto:kasparas@workbee.space',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

async function adminPb() {
  const pb = new PocketBase(PB_URL);
  await pb.collection('_superusers').authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL,
    process.env.POCKETBASE_ADMIN_PASSWORD
  );
  return pb;
}

/**
 * Send a push notification to all subscriptions for a given user.
 * @param {string} userId
 * @param {{ title: string, body: string, url?: string }} payload
 */
export async function sendPushToUser(userId, payload) {
  try {
    const pb = await adminPb();
    const subs = await pb.collection('push_subscriptions').getFullList({
      filter: `userId = "${userId}"`,
    });

    if (subs.length === 0) return;

    const message = JSON.stringify(payload);

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            message
          );
        } catch (err) {
          // Subscription expired or invalid — remove it
          if (err.statusCode === 410 || err.statusCode === 404) {
            await pb.collection('push_subscriptions').delete(sub.id).catch(() => {});
            logger.info('Removed expired push subscription', 'subId', sub.id);
          } else {
            logger.error('Push send failed', 'error', err.message, 'subId', sub.id);
          }
        }
      })
    );
  } catch (err) {
    logger.error('sendPushToUser failed', 'error', err.message, 'userId', userId);
  }
}
