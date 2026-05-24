import { Router } from 'express';
import PocketBase from 'pocketbase';
import { requirePbAuth } from '../middleware/pbAuth.js';
import logger from '../utils/logger.js';

const router = Router();

const PB_URL = process.env.POCKETBASE_URL || 'https://workbee-pocketbase-cayj-production.up.railway.app';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://workbee.space';

async function adminPb() {
  const pb = new PocketBase(PB_URL);
  await pb.collection('_superusers').authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL,
    process.env.POCKETBASE_ADMIN_PASSWORD
  );
  return pb;
}

// GET /referrals/stats — authenticated user's referral stats
router.get('/stats', requirePbAuth, async (req, res) => {
  try {
    const pb = await adminPb();
    const userId = req.pbUser.id;
    const user = await pb.collection('users').getOne(userId);

    const referrals = await pb.collection('referrals').getList(1, 200, {
      filter: `referrerId = "${userId}"`,
    });

    res.json({
      referralCode: user.referralCode || '',
      referralLink: `${FRONTEND_URL}/register?ref=${user.referralCode || ''}`,
      totalReferrals: referrals.totalItems,
    });
  } catch (err) {
    logger.error('referrals stats error:', err);
    res.status(500).json({ error: 'Failed to fetch referral stats' });
  }
});

// GET /referrals/validate/:code — check if a referral code exists (public)
router.get('/validate/:code', async (req, res) => {
  try {
    const pb = await adminPb();
    const results = await pb.collection('users').getList(1, 1, {
      filter: `referralCode = "${req.params.code}"`,
    });
    res.json({ valid: results.totalItems > 0 });
  } catch (err) {
    logger.error('referrals validate error:', err);
    res.json({ valid: false });
  }
});

export default router;
