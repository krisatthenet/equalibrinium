import { Router } from 'express';
import PocketBase from 'pocketbase';
import logger from '../utils/logger.js';
import { requirePbAuth } from '../middleware/pbAuth.js';

const PB_URL = process.env.POCKETBASE_URL || 'https://workbee-pocketbase-cayj-production.up.railway.app';

async function adminPb() {
  const pb = new PocketBase(PB_URL);
  await pb.collection('_superusers').authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL,
    process.env.POCKETBASE_ADMIN_PASSWORD,
  );
  return pb;
}

const router = Router();

// POST /reviews/:id/reply
// Contractor posts or edits their reply to a review left on their profile.
router.post('/:id/reply', requirePbAuth, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const contractorId = req.pbUser.id;
    const reply = (req.body.reply ?? '').trim();

    const pb = await adminPb();
    const review = await pb.collection('reviews').getOne(reviewId);

    if (review.contractorId !== contractorId) {
      return res.status(403).json({ error: 'Not your review to reply to' });
    }

    await pb.collection('reviews').update(reviewId, {
      reply,
      repliedAt: reply ? new Date().toISOString() : '',
    });

    logger.info(`Review ${reviewId} reply set by contractor ${contractorId}`);
    res.json({ ok: true });
  } catch (err) {
    logger.error('review reply error:', err);
    res.status(500).json({ error: err.message || 'Failed to save reply' });
  }
});

export default router;
