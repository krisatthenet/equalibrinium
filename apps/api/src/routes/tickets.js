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

// POST /tickets/:id/mark-complete
// Contractor marks a job done — links the auto-created portfolio_items record to the ticket.
router.post('/:id/mark-complete', requirePbAuth, async (req, res) => {
  try {
    const ticketId = req.params.id;
    const contractorId = req.pbUser.id;
    const { portfolioItemId } = req.body;

    const pb = await adminPb();

    // Verify this user is the accepted contractor for this ticket
    const ticket = await pb.collection('auction_tickets').getOne(ticketId);
    if (!ticket.acceptedBidId) {
      return res.status(403).json({ error: 'No accepted bid on this ticket' });
    }

    const acceptedBid = await pb.collection('bids').getOne(ticket.acceptedBidId);
    if (acceptedBid.masterId !== contractorId) {
      return res.status(403).json({ error: 'You are not the accepted contractor for this ticket' });
    }

    if (ticket.status !== 'In Progress') {
      return res.status(400).json({ error: 'Ticket is not in progress' });
    }

    await pb.collection('auction_tickets').update(ticketId, {
      contractorMarkedDone: true,
      ...(portfolioItemId ? { portfolioItemId } : {}),
    });

    logger.info(`Ticket ${ticketId} marked done by contractor ${contractorId}`);
    res.json({ ok: true });
  } catch (err) {
    logger.error('mark-complete error:', err);
    res.status(500).json({ error: err.message || 'Failed to mark ticket complete' });
  }
});

export default router;
