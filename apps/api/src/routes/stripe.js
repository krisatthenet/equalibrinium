import express from 'express';
import Stripe from 'stripe';
import PocketBase from 'pocketbase';
import logger from '../utils/logger.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLATFORM_FEE_PCT = 0.05; // 5%
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const PB_URL = process.env.POCKETBASE_URL || 'http://localhost:8090';

/** Get an admin-authenticated PocketBase client */
async function adminPb() {
  const pb = new PocketBase(PB_URL);
  await pb.collection('_superusers').authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL,
    process.env.POCKETBASE_ADMIN_PASSWORD
  );
  return pb;
}

// ---------------------------------------------------------------------------
// POST /stripe/create-checkout
// Body: { ticketId, contractorRecordId, amount, userId }
// ---------------------------------------------------------------------------
router.post('/create-checkout', async (req, res) => {
  try {
    const { ticketId, contractorRecordId, amount, userId } = req.body;
    if (!ticketId || !amount || !userId) {
      return res.status(400).json({ error: 'ticketId, amount and userId are required' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }

    // Look up contractor's Stripe account if they have one
    let applicationFeeAmount;
    let transferData;
    if (contractorRecordId) {
      try {
        const pb = await adminPb();
        const contractorRecord = await pb.collection('contractors').getOne(contractorRecordId);
        const contractorUser = await pb.collection('users').getOne(contractorRecord.userId);
        if (contractorUser.stripeAccountId && contractorUser.stripeOnboarded) {
          applicationFeeAmount = Math.round(amount * PLATFORM_FEE_PCT * 100);
          transferData = { destination: contractorUser.stripeAccountId };
          logger.info(`Using Stripe Connect for contractor: ${contractorUser.stripeAccountId}`);
        }
      } catch (err) {
        logger.warn('Could not fetch contractor Stripe account, skipping Connect:', err.message);
      }
    }

    const sessionParams = {
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: 'WorkBee Service Payment' },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&ticketId=${ticketId}`,
      cancel_url: `${FRONTEND_URL}/payment-error`,
      metadata: { ticketId, userId, contractorRecordId: contractorRecordId || '' },
    };

    if (transferData) {
      sessionParams.payment_intent_data = {
        application_fee_amount: applicationFeeAmount,
        transfer_data: transferData,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    logger.info(`Checkout session created: ${session.id} for ticket ${ticketId}`);
    res.json({ url: session.url });
  } catch (err) {
    logger.error('create-checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /stripe/session/:sessionId — verify session status
// ---------------------------------------------------------------------------
router.get('/session/:sessionId', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    res.json({
      id: session.id,
      status: session.payment_status,
      amountTotal: session.amount_total,
      customerEmail: session.customer_details?.email || null,
    });
  } catch (err) {
    logger.error('session retrieve error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /stripe/onboard-contractor
// Body: { userId }  — initiates Stripe Connect Express onboarding
// ---------------------------------------------------------------------------
router.post('/onboard-contractor', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const pb = await adminPb();
    const user = await pb.collection('users').getOne(userId);

    let accountId = user.stripeAccountId;

    // Create account if one doesn't exist yet
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'LT',
        email: user.email,
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        business_type: 'individual',
        metadata: { pbUserId: userId },
      });
      accountId = account.id;
      await pb.collection('users').update(userId, { stripeAccountId: accountId });
      logger.info(`Created Stripe Connect account ${accountId} for user ${userId}`);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${FRONTEND_URL}/settings?stripe_refresh=1`,
      return_url: `${FRONTEND_URL}/settings?stripe_return=1&userId=${userId}`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (err) {
    logger.error('onboard-contractor error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /stripe/finalize-onboarding
// Body: { userId }  — call after redirect back, marks account as onboarded
// ---------------------------------------------------------------------------
router.post('/finalize-onboarding', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const pb = await adminPb();
    const user = await pb.collection('users').getOne(userId);
    if (!user.stripeAccountId) return res.status(400).json({ error: 'No Stripe account found' });

    const account = await stripe.accounts.retrieve(user.stripeAccountId);
    const onboarded = account.details_submitted && account.charges_enabled;

    await pb.collection('users').update(userId, { stripeOnboarded: onboarded });
    logger.info(`Stripe onboarding finalized for ${userId}: onboarded=${onboarded}`);
    res.json({ onboarded, accountId: user.stripeAccountId });
  } catch (err) {
    logger.error('finalize-onboarding error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /stripe/contractor-dashboard?userId=...  — Express dashboard link
// ---------------------------------------------------------------------------
router.get('/contractor-dashboard', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const pb = await adminPb();
    const user = await pb.collection('users').getOne(userId);
    if (!user.stripeAccountId) return res.status(400).json({ error: 'No Stripe account connected' });

    const loginLink = await stripe.accounts.createLoginLink(user.stripeAccountId);
    res.json({ url: loginLink.url });
  } catch (err) {
    logger.error('contractor-dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /stripe/webhook  — Stripe webhook (raw body, verified by signature)
// ---------------------------------------------------------------------------
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    logger.info(`Processing checkout.session.completed: ${session.id}`);

    try {
      const pb = await adminPb();
      const { ticketId, userId, contractorRecordId } = session.metadata || {};
      if (!ticketId || !userId) {
        logger.warn('Webhook missing ticketId or userId in metadata');
        return res.json({ received: true });
      }

      const amountPaid = (session.amount_total || 0) / 100;

      // Idempotency: skip if payment already recorded
      const existing = await pb.collection('payments').getList(1, 1, {
        filter: `transactionId = "${session.id}"`,
      });
      if (existing.items.length > 0) {
        logger.info(`Payment already recorded for session ${session.id}, skipping`);
        return res.json({ received: true });
      }

      // Record payment
      await pb.collection('payments').create({
        ticketId,
        userId,
        amount: amountPaid,
        paymentMethod: 'stripe',
        paymentOption: 'full',
        status: 'completed',
        transactionId: session.id,
      });

      // Mark ticket as Completed
      await pb.collection('auction_tickets').update(ticketId, { status: 'Completed' });

      // Credit contractor balance (for non-Connect payouts or tracking)
      const contractorPayout = amountPaid * (1 - PLATFORM_FEE_PCT);
      let contractorUserId = null;

      if (contractorRecordId) {
        try {
          const contractorRecord = await pb.collection('contractors').getOne(contractorRecordId);
          contractorUserId = contractorRecord.userId;
        } catch (_) {}
      }

      // Fallback: find via accepted bid
      if (!contractorUserId) {
        try {
          const ticket = await pb.collection('auction_tickets').getOne(ticketId);
          if (ticket.acceptedBidId) {
            const bid = await pb.collection('bids').getOne(ticket.acceptedBidId);
            contractorUserId = bid.masterId;
          }
        } catch (_) {}
      }

      if (contractorUserId) {
        const contractorUser = await pb.collection('users').getOne(contractorUserId);
        const currentBalance = Number(contractorUser.balance) || 0;
        await pb.collection('users').update(contractorUserId, {
          balance: parseFloat((currentBalance + contractorPayout).toFixed(2)),
        });
        logger.info(`Credited €${contractorPayout.toFixed(2)} to contractor ${contractorUserId}`);
      }

      logger.info(`Webhook processed: ticket ${ticketId} completed, €${amountPaid} paid`);
    } catch (err) {
      logger.error('Webhook processing error:', err);
      // Still return 200 so Stripe doesn't retry infinitely
    }
  }

  res.json({ received: true });
});

export default router;
