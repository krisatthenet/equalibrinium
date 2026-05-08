import express from 'express';
import Stripe from 'stripe';
import PocketBase from 'pocketbase';
import logger from '../utils/logger.js';
import { getPriceId, planFromPriceId } from '../lib/stripePlans.js';
import { requirePbAuth } from '../middleware/pbAuth.js';

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
// Body: { ticketId, contractorUserId }
// Amount is fetched server-side from the ticket/bid — never trusted from the client
// Requires a valid PocketBase auth token — userId is taken from the token, not the body
// ---------------------------------------------------------------------------
router.post('/create-checkout', requirePbAuth, async (req, res) => {
  try {
    const { ticketId, contractorUserId } = req.body;
    const userId = req.pbUser.id;
    if (!ticketId) {
      return res.status(400).json({ error: 'ticketId is required' });
    }

    const pb = await adminPb();

    // Fetch ticket and verify it belongs to the requesting user
    let ticket;
    try {
      ticket = await pb.collection('auction_tickets').getOne(ticketId);
    } catch {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    if (ticket.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Resolve amount from the accepted bid or fall back to the ticket budget
    let amount;
    if (ticket.acceptedBidId) {
      try {
        const bid = await pb.collection('bids').getOne(ticket.acceptedBidId);
        amount = Number(bid.proposedRate);
      } catch {
        amount = Number(ticket.budget);
      }
    } else {
      amount = Number(ticket.budget);
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Could not determine a valid payment amount for this ticket' });
    }

    logger.info(`Server-resolved amount €${amount} for ticket ${ticketId}`);

    // Look up contractor's Stripe account if they have one
    let applicationFeeAmount;
    let transferData;
    if (contractorUserId) {
      try {
        const contractorUser = await pb.collection('users').getOne(contractorUserId);
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
      metadata: { ticketId, userId, contractorUserId: contractorUserId || '' },
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
// Requires ?userId= matching the session's metadata.userId
// ---------------------------------------------------------------------------
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

    if (session.metadata?.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({
      id: session.id,
      status: session.payment_status,
      amountTotal: session.amount_total,
      customerEmail: session.customer_details?.email || null,
      ticketId: session.metadata?.ticketId || null,
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
// GET /stripe/user-email?userId=...  — return email using admin credentials
// ---------------------------------------------------------------------------
router.get('/user-email', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const pb = await adminPb();
    const user = await pb.collection('users').getOne(userId);
    res.json({ email: user.email, phone: user.phone || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /stripe/request-payout
// Body: { userId, amount }  — transfer platform balance to contractor's Stripe account
// ---------------------------------------------------------------------------
router.post('/request-payout', async (req, res) => {
  try {
    const { userId, amount } = req.body;
    if (!userId || !amount) return res.status(400).json({ error: 'userId and amount are required' });
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }

    const pb = await adminPb();
    const user = await pb.collection('users').getOne(userId);

    if (!user.stripeAccountId || !user.stripeOnboarded) {
      return res.status(400).json({ error: 'Stripe account not connected or not fully onboarded' });
    }

    const currentBalance = Number(user.balance) || 0;
    if (amount > currentBalance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Transfer from platform to connected account
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100),
      currency: 'eur',
      destination: user.stripeAccountId,
      description: `WorkBee payout for user ${userId}`,
    });

    // Deduct from PocketBase balance
    await pb.collection('users').update(userId, {
      balance: parseFloat((currentBalance - amount).toFixed(2)),
    });

    logger.info(`Payout of €${amount} to ${user.stripeAccountId} (transfer ${transfer.id})`);
    res.json({ success: true, transferId: transfer.id, remaining: currentBalance - amount });
  } catch (err) {
    logger.error('request-payout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// POST /stripe/create-subscription-checkout
// Body: { userId, plan, cycle }
// ---------------------------------------------------------------------------
router.post('/create-subscription-checkout', async (req, res) => {
  try {
    const { userId, plan, cycle } = req.body;
    if (!userId || !plan || !cycle) {
      return res.status(400).json({ error: 'userId, plan, and cycle are required' });
    }

    const pb = await adminPb();
    const user = await pb.collection('users').getOne(userId);
    const priceId = getPriceId(user.userType, plan, cycle);

    if (!priceId) {
      return res.status(400).json({ error: `No price configured for ${user.userType} ${plan} ${cycle}` });
    }

    // Reuse or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId },
      });
      customerId = customer.id;
      await pb.collection('users').update(userId, { stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId, plan, cycle },
      success_url: `${FRONTEND_URL}/settings?subscription=success`,
      cancel_url:  `${FRONTEND_URL}/settings?subscription=cancel`,
      allow_promotion_codes: true,
    });

    res.json({ url: session.url });
  } catch (err) {
    logger.error('create-subscription-checkout error:', err);
    res.status(500).json({ error: 'Failed to create subscription checkout' });
  }
});

// ---------------------------------------------------------------------------
// POST /stripe/cancel-subscription
// Body: { userId }
// ---------------------------------------------------------------------------
router.post('/cancel-subscription', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const pb = await adminPb();
    const user = await pb.collection('users').getOne(userId);

    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Cancel at period end so user keeps access until renewal date
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    res.json({ success: true });
  } catch (err) {
    logger.error('cancel-subscription error:', err);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// ---------------------------------------------------------------------------
// GET /stripe/subscription-status?userId=...
// ---------------------------------------------------------------------------
router.get('/subscription-status', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const pb = await adminPb();
    const user = await pb.collection('users').getOne(userId);

    if (!user.stripeSubscriptionId) {
      return res.json({ plan: 'standard', status: 'none' });
    }

    const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    res.json({
      plan: user.plan || 'standard',
      cycle: user.planCycle || 'monthly',
      status: sub.status,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
    });
  } catch (err) {
    logger.error('subscription-status error:', err);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

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
      const { ticketId, userId, contractorUserId } = session.metadata || {};
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

      const contractorPayout = amountPaid * (1 - PLATFORM_FEE_PCT);
      let resolvedContractorUserId = contractorUserId || null;
      let contractorStripeOnboarded = false;

      // Fallback: find contractor via accepted bid
      if (!resolvedContractorUserId) {
        try {
          const ticket = await pb.collection('auction_tickets').getOne(ticketId);
          if (ticket.acceptedBidId) {
            const bid = await pb.collection('bids').getOne(ticket.acceptedBidId);
            resolvedContractorUserId = bid.masterId;
          }
        } catch (_) { /* ticket not found, skip */ }
      }

      if (resolvedContractorUserId) {
        const contractorUser = await pb.collection('users').getOne(resolvedContractorUserId);
        contractorStripeOnboarded = !!(contractorUser.stripeAccountId && contractorUser.stripeOnboarded);

        // Always credit balance as earnings tracker.
        // For Stripe Connect contractors the money already transferred to their Stripe account;
        // balance here serves as a display-only earnings total (payout requests are disabled for them).
        const currentBalance = Number(contractorUser.balance) || 0;
        await pb.collection('users').update(resolvedContractorUserId, {
          balance: parseFloat((currentBalance + contractorPayout).toFixed(2)),
        });
        logger.info(`Credited €${contractorPayout.toFixed(2)} to contractor ${resolvedContractorUserId} (stripeConnect=${contractorStripeOnboarded})`);
      }

      logger.info(`Webhook processed: ticket ${ticketId} completed, €${amountPaid} paid`);
    } catch (err) {
      logger.error('Webhook processing error:', err);
      // Still return 200 so Stripe doesn't retry infinitely
    }
  }

  // --- Subscription lifecycle events ---
  if (['customer.subscription.created', 'customer.subscription.updated'].includes(event.type)) {
    const sub = event.data.object;
    try {
      const pb = await adminPb();
      const priceId = sub.items?.data?.[0]?.price?.id;
      const mapped = planFromPriceId(priceId);
      if (!mapped) {
        logger.warn(`Unrecognised price ${priceId} in subscription ${sub.id}`);
        return res.json({ received: true });
      }

      // Find user by stripeCustomerId
      const results = await pb.collection('users').getList(1, 1, {
        filter: `stripeCustomerId = "${sub.customer}"`,
      });
      if (!results.items.length) {
        logger.warn(`No user found for Stripe customer ${sub.customer}`);
        return res.json({ received: true });
      }
      const user = results.items[0];

      await pb.collection('users').update(user.id, {
        plan:                 mapped.plan,
        planCycle:            mapped.cycle,
        planExpiresAt:        new Date(sub.current_period_end * 1000).toISOString(),
        stripeSubscriptionId: sub.id,
      });
      logger.info(`Plan updated: user=${user.id} plan=${mapped.plan} cycle=${mapped.cycle}`);
    } catch (err) {
      logger.error('Subscription create/update webhook error:', err);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    try {
      const pb = await adminPb();
      const results = await pb.collection('users').getList(1, 1, {
        filter: `stripeCustomerId = "${sub.customer}"`,
      });
      if (results.items.length) {
        await pb.collection('users').update(results.items[0].id, {
          plan:                 'standard',
          planCycle:            '',
          planExpiresAt:        '',
          stripeSubscriptionId: '',
        });
        logger.info(`Subscription cancelled: user=${results.items[0].id} → standard`);
      }
    } catch (err) {
      logger.error('Subscription deleted webhook error:', err);
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object;
    logger.warn(`Payment failed for customer ${invoice.customer}, subscription ${invoice.subscription}`);
  }

  res.json({ received: true });
});

export default router;
