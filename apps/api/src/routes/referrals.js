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

// GET /referrals/stats — authenticated user's referral stats + history
router.get('/stats', requirePbAuth, async (req, res) => {
  try {
    const pb = await adminPb();
    const userId = req.pbUser.id;
    const user = await pb.collection('users').getOne(userId);

    const referrals = await pb.collection('referrals').getList(1, 50, {
      filter: `referrerId = "${userId}"`,
      sort: '-rewardedAt',
    });

    // Enrich each referral with the referred user's name
    const history = await Promise.all(
      referrals.items.map(async (r) => {
        let name = 'Unknown';
        try {
          const referred = await pb.collection('users').getOne(r.referredId, { fields: 'id,name' });
          name = referred.name || 'Unknown';
        } catch (_) {}
        return { id: r.id, date: r.rewardedAt, name, earned: 10 };
      })
    );

    res.json({
      referralCode:   user.referralCode || '',
      referralLink:   `${FRONTEND_URL}/register?ref=${user.referralCode || ''}`,
      totalReferrals: referrals.totalItems,
      totalEarned:    referrals.totalItems * 10,
      history,
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
