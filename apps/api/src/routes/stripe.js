import express from 'express';
import Stripe from 'stripe';
import PocketBase from 'pocketbase';
import logger from '../utils/logger.js';
import { getPriceId, planFromPriceId } from '../lib/stripePlans.js';
import { requirePbAuth } from '../middleware/pbAuth.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.get('/health', async (req, res) => {
  try {
    await stripe.balance.retrieve();
    res.json({ ok: true });
  } catch (e) {
    res.status(503).json({ ok: false, error: e.message });
  }
});

const PLATFORM_FEE_PCT = 0.05; // 5%
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://workbee.space';
const PB_URL = process.env.POCKETBASE_URL || 'https://workbee-pocketbase-cayj-production.up.railway.app';

/** Get an admin-authenticated PocketBase client */
async function adminPb() {
  const pb = new PocketBase(PB_URL);
  await pb.collection('_superusers').authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL,
    process.env.POCKETBASE_ADMIN_PASSWORD
  );
  return pb;
}

/** Find or create a Stripe Customer for a user and persist the ID back to PocketBase */
async function getOrCreateStripeCustomer(pb, user) {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const existing = await stripe.customers.list({ email: user.email, limit: 1 });
  let customerId;
  if (existing.data.length > 0) {
    customerId = existing.data[0].id;
  } else {
    const customer = await stripe.customers.create({ email: user.email, name: user.name || undefined, metadata: { userId: user.id } });
    customerId = customer.id;
  }
  await pb.collection('users').update(user.id, { stripeCustomerId: customerId }).catch(() => {});
  return customerId;
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
    if (ticket.clientId !== userId) {
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

    // Attach/create a Stripe Customer so the client can use the portal later
    const clientUser = await pb.collection('users').getOne(userId).catch(() => null);
    let customerId;
    if (clientUser) {
      customerId = await getOrCreateStripeCustomer(pb, clientUser).catch(() => null);
    }

    const sessionParams = {
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
    if (customerId) sessionParams.customer = customerId;

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
// Initiates Stripe Connect Express onboarding for the authenticated contractor
// ---------------------------------------------------------------------------
router.post('/onboard-contractor', requirePbAuth, async (req, res) => {
  try {
    const userId = req.pbUser.id;
    const pb = await adminPb();
    const user = await pb.collection('users').getOne(userId);

    let accountId = user.stripeAccountId;

    // Verify existing account is still valid — stale IDs from deleted/test accounts will throw
    if (accountId) {
      try {
        await stripe.accounts.retrieve(accountId);
      } catch (err) {
        logger.warn(`Stale stripeAccountId ${accountId} for user ${userId}, resetting: ${err.message}`);
        accountId = null;
        await pb.collection('users').update(userId, { stripeAccountId: '', stripeOnboarded: false });
      }
    }

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
      return_url: `${FRONTEND_URL}/settings?stripe_return=1`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (err) {
    logger.error('onboard-contractor error:', err);
    const msg = err?.raw?.message || err.message || 'Failed to start Stripe onboarding';
    res.status(500).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// POST /stripe/finalize-onboarding
// Call after redirect back — marks the authenticated contractor's account as onboarded
// ---------------------------------------------------------------------------
router.post('/finalize-onboarding', requirePbAuth, async (req, res) => {
  try {
    const userId = req.pbUser.id;
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
// GET /stripe/client-portal — create a Stripe Customer Portal session for a client
// ---------------------------------------------------------------------------
router.get('/client-portal', requirePbAuth, async (req, res) => {
  try {
    const userId = req.pbUser.id;
    const pb = await adminPb();
    const user = await pb.collection('users').getOne(userId);

    let customerId = await getOrCreateStripeCustomer(pb, user);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${FRONTEND_URL}/settings`,
    });
    res.json({ url: session.url });
  } catch (err) {
    logger.error('client-portal error:', err);
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
// Body: { amount }  — transfer platform balance to the authenticated contractor's Stripe account
// ---------------------------------------------------------------------------
router.post('/request-payout', requirePbAuth, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.pbUser.id;
    if (!amount) return res.status(400).json({ error: 'amount is required' });
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
    const newBalance = parseFloat((currentBalance - amount).toFixed(2));
    await pb.collection('users').update(userId, { balance: newBalance });

    logger.info(`Payout of €${amount} to ${user.stripeAccountId} (transfer ${transfer.id})`);
    res.json({ success: true, transferId: transfer.id, remaining: newBalance });
  } catch (err) {
    logger.error('request-payout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// POST /stripe/create-boost-checkout
// One-off payment for a 30-day featured listing slot
// ---------------------------------------------------------------------------
router.post('/create-boost-checkout', requirePbAuth, async (req, res) => {
  try {
    const userId = req.pbUser.id;
    const BOOST_PRICE_CENTS = Number(process.env.BOOST_PRICE_CENTS) || 1900; // €19

    const pb = await adminPb();
    const user = await pb.collection('users').getOne(userId);

    if (user.userType !== 'contractor' && user.userType !== 'master') {
      return res.status(403).json({ error: 'Only contractors can purchase a listing boost' });
    }

    const customerId = await getOrCreateStripeCustomer(pb, user);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'WorkBee Featured Listing — 30 Days',
            description: 'Your profile is pinned at the top of search results and marked as Featured for 30 days.',
          },
          unit_amount: BOOST_PRICE_CENTS,
        },
        quantity: 1,
      }],
      success_url: `${FRONTEND_URL}/dashboard/contractor?boost=success`,
      cancel_url:  `${FRONTEND_URL}/dashboard/contractor`,
      metadata: { userId, type: 'boost' },
    });

    logger.info(`Boost checkout session created: ${session.id} for user ${userId}`);
    res.json({ url: session.url });
  } catch (err) {
    logger.error('create-boost-checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /stripe/create-subscription-checkout
// Body: { userId, plan, cycle }
// ---------------------------------------------------------------------------
router.post('/create-subscription-checkout', requirePbAuth, async (req, res) => {
  try {
    const { plan, cycle, trial, successPath } = req.body;
    const userId = req.pbUser.id;
    if (!plan || !cycle) {
      return res.status(400).json({ error: 'plan and cycle are required' });
    }

    const pb = await adminPb();
    const user = await pb.collection('users').getOne(userId);
    const priceId = getPriceId(user.userType, plan, cycle);

    if (!priceId) {
      return res.status(400).json({ error: `No price configured for ${user.userType} ${plan} ${cycle}` });
    }

    // Reuse or create Stripe customer
    let customerId;
    try {
      customerId = await getOrCreateStripeCustomer(pb, user);
    } catch (err) {
      logger.error('create-subscription-checkout: customer creation failed:', err);
      return res.status(502).json({ error: 'Could not create or retrieve Stripe customer. Please try again.' });
    }

    const successUrl = successPath
      ? `${FRONTEND_URL}${successPath}`
      : `${FRONTEND_URL}/settings?subscription=success`;

    const sessionParams = {
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId, plan, cycle },
      success_url: successUrl,
      cancel_url:  `${FRONTEND_URL}/settings?subscription=cancel`,
      allow_promotion_codes: true,
    };

    if (trial) {
      sessionParams.subscription_data = { trial_period_days: 7 };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
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
router.post('/cancel-subscription', requirePbAuth, async (req, res) => {
  try {
    const userId = req.pbUser.id;

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
router.get('/subscription-status', requirePbAuth, async (req, res) => {
  try {
    const userId = req.pbUser.id;

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

// ---------------------------------------------------------------------------
// POST /stripe/create-escrow
// Body: { ticketId, bidId, contractorUserId }
// Creates a Stripe Checkout Session with capture_method: 'manual' (authorize-only)
// ---------------------------------------------------------------------------
router.post('/create-escrow', requirePbAuth, async (req, res) => {
  try {
    const { ticketId, bidId, contractorUserId } = req.body;
    const userId = req.pbUser.id;
    if (!ticketId || !bidId) {
      return res.status(400).json({ error: 'ticketId and bidId are required' });
    }

    const pb = await adminPb();

    const ticket = await pb.collection('auction_tickets').getOne(ticketId).catch(() => null);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (ticket.clientId !== userId) return res.status(403).json({ error: 'Forbidden' });
    if (ticket.status !== 'In Progress') return res.status(400).json({ error: 'Ticket must be In Progress' });

    const bid = await pb.collection('bids').getOne(bidId).catch(() => null);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (bid.status !== 'accepted') return res.status(400).json({ error: 'Bid is not accepted' });

    // Idempotency: return existing held escrow if already paid
    const existing = await pb.collection('escrow_payments').getList(1, 1, {
      filter: `ticketId = "${ticketId}" && (status = "held" || status = "released")`,
    });
    if (existing.items.length > 0) {
      return res.status(409).json({ error: 'Escrow already exists for this ticket', escrow: existing.items[0] });
    }

    const amount = Number(bid.proposedRate);
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid bid amount' });

    const clientUser = await pb.collection('users').getOne(userId).catch(() => null);
    let customerId;
    if (clientUser) customerId = await getOrCreateStripeCustomer(pb, clientUser).catch(() => null);

    const sessionParams = {
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: 'WorkBee Escrow — Service Payment' },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      payment_intent_data: { capture_method: 'manual' },
      success_url: `${FRONTEND_URL}/auction-ticket/${ticketId}?escrow=success`,
      cancel_url:  `${FRONTEND_URL}/auction-ticket/${ticketId}?escrow=cancel`,
      metadata: {
        type: 'escrow',
        ticketId,
        bidId,
        userId,
        contractorUserId: contractorUserId || '',
      },
    };
    if (customerId) sessionParams.customer = customerId;

    const session = await stripe.checkout.sessions.create(sessionParams);
    logger.info(`Escrow checkout session created: ${session.id} for ticket ${ticketId}`);
    res.json({ url: session.url });
  } catch (err) {
    logger.error('create-escrow error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /stripe/release-escrow
// Body: { ticketId }
// Captures the PaymentIntent, optionally transfers to contractor, marks ticket Completed
// ---------------------------------------------------------------------------
router.post('/release-escrow', requirePbAuth, async (req, res) => {
  try {
    const { ticketId } = req.body;
    const userId = req.pbUser.id;
    if (!ticketId) return res.status(400).json({ error: 'ticketId is required' });

    const pb = await adminPb();

    const ticket = await pb.collection('auction_tickets').getOne(ticketId).catch(() => null);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (ticket.clientId !== userId) return res.status(403).json({ error: 'Forbidden' });

    const escrows = await pb.collection('escrow_payments').getList(1, 1, {
      filter: `ticketId = "${ticketId}" && status = "held"`,
    });
    if (!escrows.items.length) return res.status(404).json({ error: 'No held escrow found for this ticket' });
    const escrow = escrows.items[0];

    const pi = await stripe.paymentIntents.retrieve(escrow.stripePaymentIntentId);

    // Build capture params — optionally transfer to contractor's Stripe account
    let captureParams = {};
    let contractorStripeAccountId;
    try {
      const contractor = await pb.collection('users').getOne(escrow.contractorId);
      if (contractor.stripeAccountId && contractor.stripeOnboarded) {
        contractorStripeAccountId = contractor.stripeAccountId;
        const fee = Math.round(escrow.amount * PLATFORM_FEE_PCT * 100);
        captureParams = {
          application_fee_amount: fee,
          transfer_data: { destination: contractorStripeAccountId },
        };
      }
    } catch (_) {}

    await stripe.paymentIntents.capture(escrow.stripePaymentIntentId, captureParams);

    // Credit contractor balance
    const contractorPayout = escrow.amount * (1 - PLATFORM_FEE_PCT);
    try {
      const contractor = await pb.collection('users').getOne(escrow.contractorId);
      const currentBalance = Number(contractor.balance) || 0;
      await pb.collection('users').update(escrow.contractorId, {
        balance: parseFloat((currentBalance + contractorPayout).toFixed(2)),
      });
    } catch (_) {}

    // Record payment + update statuses
    await pb.collection('payments').create({
      ticketId,
      userId,
      amount: escrow.amount,
      paymentMethod: 'stripe',
      paymentOption: 'escrow',
      status: 'completed',
      transactionId: escrow.stripePaymentIntentId,
    }).catch(() => {});

    await pb.collection('escrow_payments').update(escrow.id, { status: 'released' });
    await pb.collection('auction_tickets').update(ticketId, { status: 'Completed' });

    logger.info(`Escrow released: ticket ${ticketId}, €${escrow.amount} captured`);
    res.json({ success: true });
  } catch (err) {
    logger.error('release-escrow error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /stripe/refund-escrow
// Body: { ticketId }
// Cancels the uncaptured PaymentIntent (full auth reversal — no charge)
// ---------------------------------------------------------------------------
router.post('/refund-escrow', requirePbAuth, async (req, res) => {
  try {
    const { ticketId } = req.body;
    const userId = req.pbUser.id;
    if (!ticketId) return res.status(400).json({ error: 'ticketId is required' });

    const pb = await adminPb();

    const ticket = await pb.collection('auction_tickets').getOne(ticketId).catch(() => null);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (ticket.clientId !== userId) return res.status(403).json({ error: 'Forbidden' });

    const escrows = await pb.collection('escrow_payments').getList(1, 1, {
      filter: `ticketId = "${ticketId}" && status = "held"`,
    });
    if (!escrows.items.length) return res.status(404).json({ error: 'No held escrow found for this ticket' });
    const escrow = escrows.items[0];

    await stripe.paymentIntents.cancel(escrow.stripePaymentIntentId);
    await pb.collection('escrow_payments').update(escrow.id, { status: 'refunded' });
    await pb.collection('auction_tickets').update(ticketId, { status: 'Open' });

    logger.info(`Escrow refunded (auth cancelled): ticket ${ticketId}`);
    res.json({ success: true });
  } catch (err) {
    logger.error('refund-escrow error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /stripe/escrow-status?ticketId=...
router.get('/escrow-status', requirePbAuth, async (req, res) => {
  try {
    const { ticketId } = req.query;
    if (!ticketId) return res.status(400).json({ error: 'ticketId is required' });

    const pb = await adminPb();
    const escrows = await pb.collection('escrow_payments').getList(1, 1, {
      filter: `ticketId = "${ticketId}"`,
      sort: '-created',
    });
    if (!escrows.items.length) return res.json({ escrow: null });

    const e = escrows.items[0];
    res.json({ escrow: { id: e.id, status: e.status, amount: e.amount, contractorId: e.contractorId } });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    // --- Escrow hold (authorize-only payment) ---
    if (session.metadata?.type === 'escrow') {
      const { ticketId, bidId, userId, contractorUserId } = session.metadata;
      if (ticketId && bidId && userId) {
        try {
          const pb = await adminPb();

          // Idempotency: skip if already recorded
          const existing = await pb.collection('escrow_payments').getList(1, 1, {
            filter: `stripeSessionId = "${session.id}"`,
          });
          if (existing.items.length === 0) {
            const pi = await stripe.checkout.sessions.retrieve(session.id, { expand: ['payment_intent'] });
            const paymentIntentId = typeof pi.payment_intent === 'string'
              ? pi.payment_intent
              : pi.payment_intent?.id;

            await pb.collection('escrow_payments').create({
              ticketId,
              bidId,
              clientId: userId,
              contractorId: contractorUserId || '',
              amount: (session.amount_total || 0) / 100,
              stripePaymentIntentId: paymentIntentId || '',
              stripeSessionId: session.id,
              status: 'held',
            });
            logger.info(`Escrow held: ticket ${ticketId}, PI=${paymentIntentId}`);
          }
        } catch (err) {
          logger.error('Escrow webhook error:', err);
        }
      }
      return res.json({ received: true });
    }

    // --- Featured listing boost ---
    if (session.metadata?.type === 'boost') {
      const { userId } = session.metadata;
      if (userId) {
        try {
          const pb = await adminPb();
          const boostedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          await pb.collection('users').update(userId, { isPromoted: true, promotedUntil: boostedUntil });
          logger.info(`Boost activated for user ${userId} until ${boostedUntil}`);
        } catch (err) {
          logger.error('Boost webhook error:', err);
        }
      }
      return res.json({ received: true });
    }

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

      let planExpiresAt = new Date(sub.current_period_end * 1000);

      // Apply referral free month (one-time, consumed here)
      const freeMonths = Number(user.referralFreeMonths) || 0;
      if (freeMonths > 0) {
        planExpiresAt.setDate(planExpiresAt.getDate() + 30 * freeMonths);
        logger.info(`Referral free month applied: user=${user.id} freeMonths=${freeMonths}`);
      }

      const updateData = {
        plan:                 mapped.plan,
        planCycle:            mapped.cycle,
        planExpiresAt:        planExpiresAt.toISOString(),
        stripeSubscriptionId: sub.id,
      };
      if (freeMonths > 0) updateData.referralFreeMonths = 0;

      await pb.collection('users').update(user.id, updateData);
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

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object;
    if (invoice.subscription) {
      try {
        const pb = await adminPb();
        const sub = await stripe.subscriptions.retrieve(invoice.subscription);
        const priceId = sub.items?.data?.[0]?.price?.id;
        const mapped = planFromPriceId(priceId);
        if (mapped) {
          const results = await pb.collection('users').getList(1, 1, {
            filter: `stripeCustomerId = "${invoice.customer}"`,
          });
          if (results.items.length) {
            const planExpiresAt = new Date(sub.current_period_end * 1000);
            await pb.collection('users').update(results.items[0].id, {
              plan: mapped.plan,
              planCycle: mapped.cycle,
              planExpiresAt: planExpiresAt.toISOString(),
              stripeSubscriptionId: sub.id,
            });
            logger.info(`invoice.paid renewal: user=${results.items[0].id} plan=${mapped.plan} expires=${planExpiresAt.toISOString()}`);
          }
        }
      } catch (err) {
        logger.error('invoice.paid webhook error:', err);
      }
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object;
    logger.warn(`Payment failed for customer ${invoice.customer}, subscription ${invoice.subscription}`);
  }

  res.json({ received: true });
});

export default router;
