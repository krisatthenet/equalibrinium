import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../test-utils/createApp.js';

// ---------------------------------------------------------------------------
// Stripe SDK mock — vi.hoisted ensures fns exist before vi.mock is hoisted
// ---------------------------------------------------------------------------
const {
  stripeCheckoutCreate,
  stripeCheckoutRetrieve,
  stripeAccountsCreate,
  stripeAccountsRetrieve,
  stripeAccountsLogin,
  stripeAccountLinksCreate,
  stripeCustomersCreate,
  stripeCustomersList,
  stripeSubsRetrieve,
  stripeSubsUpdate,
  stripeTransfersCreate,
  stripeWebhooksConstruct,
} = vi.hoisted(() => ({
  stripeCheckoutCreate:     vi.fn(),
  stripeCheckoutRetrieve:   vi.fn(),
  stripeAccountsCreate:     vi.fn(),
  stripeAccountsRetrieve:   vi.fn(),
  stripeAccountsLogin:      vi.fn(),
  stripeAccountLinksCreate: vi.fn(),
  stripeCustomersCreate:    vi.fn(),
  stripeCustomersList:      vi.fn(),
  stripeSubsRetrieve:       vi.fn(),
  stripeSubsUpdate:         vi.fn(),
  stripeTransfersCreate:    vi.fn(),
  stripeWebhooksConstruct:  vi.fn(),
}));

vi.mock('stripe', () => ({
  default: function Stripe() {
    return {
      checkout:      { sessions:   { create: stripeCheckoutCreate,   retrieve: stripeCheckoutRetrieve } },
      accounts:      { create: stripeAccountsCreate, retrieve: stripeAccountsRetrieve, createLoginLink: stripeAccountsLogin },
      accountLinks:  { create: stripeAccountLinksCreate },
      customers:     { create: stripeCustomersCreate, list: stripeCustomersList },
      subscriptions: { retrieve: stripeSubsRetrieve, update: stripeSubsUpdate },
      transfers:     { create: stripeTransfersCreate },
      webhooks:      { constructEvent: stripeWebhooksConstruct },
    };
  },
}));

// ---------------------------------------------------------------------------
// PocketBase mock — single shared collection stubs (reset in beforeEach)
// ---------------------------------------------------------------------------
const pbCol = vi.hoisted(() => ({
  authWithPassword: vi.fn(),
  authRefresh:      vi.fn(),
  getOne:           vi.fn(),
  getList:          vi.fn(),
  getFullList:      vi.fn(),
  update:           vi.fn(),
  create:           vi.fn(),
}));

vi.mock('pocketbase', () => ({
  default: function PocketBase() {
    return {
      authStore: { save: vi.fn() },
      collection: vi.fn(() => pbCol),
    };
  },
}));

// ---------------------------------------------------------------------------
// stripePlans mock — avoid module-load-time env var reads
// ---------------------------------------------------------------------------
const { mockGetPriceId, mockPlanFromPriceId } = vi.hoisted(() => ({
  mockGetPriceId:      vi.fn(),
  mockPlanFromPriceId: vi.fn(),
}));

vi.mock('../lib/stripePlans.js', () => ({
  getPriceId:      mockGetPriceId,
  planFromPriceId: mockPlanFromPriceId,
}));

// ---------------------------------------------------------------------------
// requirePbAuth middleware — injects pre-authenticated user
// ---------------------------------------------------------------------------
vi.mock('../middleware/pbAuth.js', () => ({
  requirePbAuth: vi.fn((req, _res, next) => {
    req.pbUser = { id: 'user-1' };
    next();
  }),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const TICKET              = { id: 'ticket-1', clientId: 'user-1', budget: 100, acceptedBidId: null, status: 'Open' };
const BID                 = { id: 'bid-1', proposedRate: 80, masterId: 'contractor-1' };
const CONTRACTOR_NO_STRIPE = { id: 'contractor-1', stripeAccountId: null,    stripeOnboarded: false, balance: 0   };
const CONTRACTOR_STRIPE    = { id: 'contractor-1', stripeAccountId: 'acct_123', stripeOnboarded: true,  balance: 50  };

function resetPbDefaults() {
  vi.clearAllMocks();
  pbCol.authWithPassword.mockResolvedValue({});
  pbCol.update.mockResolvedValue({});
  pbCol.create.mockResolvedValue({});
  pbCol.getOne.mockResolvedValue(null);
}

// ===========================================================================
// POST /stripe/create-checkout
// ===========================================================================
describe('POST /stripe/create-checkout', () => {
  const app = createApp();
  beforeEach(resetPbDefaults);

  it('returns 400 when ticketId is missing', async () => {
    const res = await request(app).post('/stripe/create-checkout').set('Authorization', 'Bearer tok').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ticketId/i);
  });

  it('returns 404 when ticket does not exist', async () => {
    pbCol.getOne.mockRejectedValueOnce(new Error('not found'));
    const res = await request(app)
      .post('/stripe/create-checkout')
      .set('Authorization', 'Bearer tok')
      .send({ ticketId: 'bad' });
    expect(res.status).toBe(404);
  });

  it('returns 403 when ticket belongs to a different user', async () => {
    pbCol.getOne.mockResolvedValueOnce({ ...TICKET, clientId: 'other' });
    const res = await request(app)
      .post('/stripe/create-checkout')
      .set('Authorization', 'Bearer tok')
      .send({ ticketId: 'ticket-1' });
    expect(res.status).toBe(403);
  });

  it('returns 400 when resolved amount is 0', async () => {
    pbCol.getOne.mockResolvedValueOnce({ ...TICKET, budget: 0 });
    const res = await request(app)
      .post('/stripe/create-checkout')
      .set('Authorization', 'Bearer tok')
      .send({ ticketId: 'ticket-1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/valid payment amount/i);
  });

  it('uses ticket budget when no accepted bid', async () => {
    pbCol.getOne.mockResolvedValueOnce(TICKET);
    stripeCheckoutCreate.mockResolvedValueOnce({ id: 'cs_1', url: 'https://stripe.com/pay/cs_1' });

    const res = await request(app)
      .post('/stripe/create-checkout')
      .set('Authorization', 'Bearer tok')
      .send({ ticketId: 'ticket-1' });

    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://stripe.com/pay/cs_1');
    const params = stripeCheckoutCreate.mock.calls[0][0];
    expect(params.line_items[0].price_data.unit_amount).toBe(10000); // €100 → 10000 cents
  });

  it('uses accepted bid proposedRate when bid exists', async () => {
    pbCol.getOne
      .mockResolvedValueOnce({ ...TICKET, acceptedBidId: 'bid-1' }) // ticket
      .mockResolvedValueOnce(BID);                                   // bid
    stripeCheckoutCreate.mockResolvedValueOnce({ id: 'cs_2', url: 'https://stripe.com/pay/cs_2' });

    const res = await request(app)
      .post('/stripe/create-checkout')
      .set('Authorization', 'Bearer tok')
      .send({ ticketId: 'ticket-1', contractorUserId: 'contractor-1' });

    expect(res.status).toBe(200);
    const params = stripeCheckoutCreate.mock.calls[0][0];
    expect(params.line_items[0].price_data.unit_amount).toBe(8000); // €80 → 8000 cents
  });

  it('adds Stripe Connect transfer_data when contractor is fully onboarded', async () => {
    pbCol.getOne
      .mockResolvedValueOnce(TICKET)          // ticket
      .mockResolvedValueOnce(CONTRACTOR_STRIPE); // contractor
    stripeCheckoutCreate.mockResolvedValueOnce({ id: 'cs_3', url: 'https://stripe.com/pay/cs_3' });

    const res = await request(app)
      .post('/stripe/create-checkout')
      .set('Authorization', 'Bearer tok')
      .send({ ticketId: 'ticket-1', contractorUserId: 'contractor-1' });

    expect(res.status).toBe(200);
    const params = stripeCheckoutCreate.mock.calls[0][0];
    expect(params.payment_intent_data.transfer_data.destination).toBe('acct_123');
    expect(params.payment_intent_data.application_fee_amount).toBe(500); // 5% of €100
  });

  it('omits payment_intent_data when contractor has no Stripe account', async () => {
    pbCol.getOne
      .mockResolvedValueOnce(TICKET)
      .mockResolvedValueOnce(CONTRACTOR_NO_STRIPE);
    stripeCheckoutCreate.mockResolvedValueOnce({ id: 'cs_4', url: 'https://stripe.com/pay/cs_4' });

    await request(app)
      .post('/stripe/create-checkout')
      .set('Authorization', 'Bearer tok')
      .send({ ticketId: 'ticket-1', contractorUserId: 'contractor-1' });

    const params = stripeCheckoutCreate.mock.calls[0][0];
    expect(params.payment_intent_data).toBeUndefined();
  });

  it('embeds ticketId and userId in session metadata', async () => {
    pbCol.getOne.mockResolvedValueOnce(TICKET);
    stripeCheckoutCreate.mockResolvedValueOnce({ id: 'cs_5', url: 'https://stripe.com' });

    await request(app)
      .post('/stripe/create-checkout')
      .set('Authorization', 'Bearer tok')
      .send({ ticketId: 'ticket-1' });

    const params = stripeCheckoutCreate.mock.calls[0][0];
    expect(params.metadata.ticketId).toBe('ticket-1');
    expect(params.metadata.userId).toBe('user-1');
  });
});

// ===========================================================================
// GET /stripe/session/:sessionId
// ===========================================================================
describe('GET /stripe/session/:sessionId', () => {
  const app = createApp();
  beforeEach(resetPbDefaults);

  it('returns 400 when userId query param is missing', async () => {
    const res = await request(app).get('/stripe/session/cs_test');
    expect(res.status).toBe(400);
  });

  it('returns 403 when session belongs to a different user', async () => {
    stripeCheckoutRetrieve.mockResolvedValueOnce({
      id: 'cs_test', payment_status: 'paid', amount_total: 8000,
      customer_details: { email: 'a@b.com' },
      metadata: { userId: 'other-user', ticketId: 'ticket-1' },
    });
    const res = await request(app).get('/stripe/session/cs_test?userId=user-1');
    expect(res.status).toBe(403);
  });

  it('returns session data when userId matches', async () => {
    stripeCheckoutRetrieve.mockResolvedValueOnce({
      id: 'cs_test', payment_status: 'paid', amount_total: 8000,
      customer_details: { email: 'a@b.com' },
      metadata: { userId: 'user-1', ticketId: 'ticket-1' },
    });
    const res = await request(app).get('/stripe/session/cs_test?userId=user-1');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('paid');
    expect(res.body.ticketId).toBe('ticket-1');
    expect(res.body.amountTotal).toBe(8000);
  });
});

// ===========================================================================
// POST /stripe/create-subscription-checkout
// ===========================================================================
describe('POST /stripe/create-subscription-checkout', () => {
  const app = createApp();
  beforeEach(resetPbDefaults);

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/stripe/create-subscription-checkout')
      .send({ userId: 'u1', plan: 'vip' }); // missing cycle
    expect(res.status).toBe(400);
  });

  it('returns 400 when plan has no configured price ID', async () => {
    pbCol.getOne.mockResolvedValueOnce({ id: 'u1', userType: 'contractor', email: 'a@b.com', stripeCustomerId: null });
    mockGetPriceId.mockReturnValueOnce(null);
    const res = await request(app)
      .post('/stripe/create-subscription-checkout')
      .send({ userId: 'u1', plan: 'nonexistent-plan', cycle: 'monthly' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/No price configured/i);
  });

  it('creates a new Stripe customer when none exists and persists it', async () => {
    mockGetPriceId.mockReturnValueOnce('price_vip_m');
    pbCol.getOne.mockResolvedValueOnce({ id: 'u1', userType: 'contractor', email: 'a@b.com', stripeCustomerId: null });
    stripeCustomersList.mockResolvedValueOnce({ data: [] });
    stripeCustomersCreate.mockResolvedValueOnce({ id: 'cus_new' });
    stripeCheckoutCreate.mockResolvedValueOnce({ url: 'https://stripe.com/sub' });

    const res = await request(app)
      .post('/stripe/create-subscription-checkout')
      .send({ userId: 'u1', plan: 'vip', cycle: 'monthly' });

    expect(res.status).toBe(200);
    expect(stripeCustomersCreate).toHaveBeenCalledOnce();
    expect(pbCol.update).toHaveBeenCalledWith('u1', { stripeCustomerId: 'cus_new' });
    expect(res.body.url).toBe('https://stripe.com/sub');
  });

  it('reuses existing Stripe customer without creating a new one', async () => {
    mockGetPriceId.mockReturnValueOnce('price_vip_m');
    pbCol.getOne.mockResolvedValueOnce({ id: 'u1', userType: 'contractor', email: 'a@b.com', stripeCustomerId: 'cus_existing' });
    stripeCheckoutCreate.mockResolvedValueOnce({ url: 'https://stripe.com/sub' });

    const res = await request(app)
      .post('/stripe/create-subscription-checkout')
      .send({ userId: 'u1', plan: 'vip', cycle: 'monthly' });

    expect(res.status).toBe(200);
    expect(stripeCustomersCreate).not.toHaveBeenCalled();
  });

  it('passes priceId and customer to checkout session', async () => {
    mockGetPriceId.mockReturnValueOnce('price_vip_m');
    pbCol.getOne.mockResolvedValueOnce({ id: 'u1', userType: 'contractor', email: 'a@b.com', stripeCustomerId: 'cus_abc' });
    stripeCheckoutCreate.mockResolvedValueOnce({ url: 'https://stripe.com/sub' });

    await request(app)
      .post('/stripe/create-subscription-checkout')
      .send({ userId: 'u1', plan: 'vip', cycle: 'monthly' });

    const params = stripeCheckoutCreate.mock.calls[0][0];
    expect(params.mode).toBe('subscription');
    expect(params.customer).toBe('cus_abc');
    expect(params.line_items[0].price).toBe('price_vip_m');
  });
});

// ===========================================================================
// POST /stripe/cancel-subscription
// ===========================================================================
describe('POST /stripe/cancel-subscription', () => {
  const app = createApp();
  beforeEach(resetPbDefaults);

  it('returns 400 when user has no active subscription', async () => {
    pbCol.getOne.mockResolvedValueOnce({ id: 'u1', stripeSubscriptionId: null });
    const res = await request(app).post('/stripe/cancel-subscription').send({ userId: 'u1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/No active subscription/i);
  });

  it('cancels subscription at period end', async () => {
    pbCol.getOne.mockResolvedValueOnce({ id: 'u1', stripeSubscriptionId: 'sub_123' });
    stripeSubsUpdate.mockResolvedValueOnce({ cancel_at_period_end: true });

    const res = await request(app).post('/stripe/cancel-subscription').send({ userId: 'u1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(stripeSubsUpdate).toHaveBeenCalledWith('sub_123', { cancel_at_period_end: true });
  });
});

// ===========================================================================
// GET /stripe/subscription-status
// ===========================================================================
describe('GET /stripe/subscription-status', () => {
  const app = createApp();
  beforeEach(resetPbDefaults);

  it('returns standard/none when user has no subscription', async () => {
    pbCol.getOne.mockResolvedValueOnce({ id: 'u1', stripeSubscriptionId: null });
    const res = await request(app).get('/stripe/subscription-status?userId=u1');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ plan: 'standard', status: 'none' });
  });

  it('returns live subscription details', async () => {
    const periodEnd = Math.floor(Date.now() / 1000) + 86400;
    pbCol.getOne.mockResolvedValueOnce({ id: 'u1', stripeSubscriptionId: 'sub_123', plan: 'vip', planCycle: 'monthly' });
    stripeSubsRetrieve.mockResolvedValueOnce({
      status: 'active', cancel_at_period_end: false, current_period_end: periodEnd,
    });

    const res = await request(app).get('/stripe/subscription-status?userId=u1');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ plan: 'vip', cycle: 'monthly', status: 'active', cancelAtPeriodEnd: false });
    expect(res.body.currentPeriodEnd).toBeDefined();
  });
});

// ===========================================================================
// POST /stripe/onboard-contractor
// ===========================================================================
describe('POST /stripe/onboard-contractor', () => {
  const app = createApp();
  beforeEach(resetPbDefaults);

  it('creates a new Stripe Express account and returns onboarding URL', async () => {
    pbCol.getOne.mockResolvedValueOnce({ id: 'u1', email: 'a@b.com', stripeAccountId: null });
    stripeAccountsCreate.mockResolvedValueOnce({ id: 'acct_new' });
    stripeAccountLinksCreate.mockResolvedValueOnce({ url: 'https://connect.stripe.com/onboard' });

    const res = await request(app).post('/stripe/onboard-contractor').send({ userId: 'u1' });

    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://connect.stripe.com/onboard');
    expect(pbCol.update).toHaveBeenCalledWith('user-1', { stripeAccountId: 'acct_new' });
  });

  it('reuses existing Stripe account without creating a new one', async () => {
    pbCol.getOne.mockResolvedValueOnce({ id: 'u1', email: 'a@b.com', stripeAccountId: 'acct_existing' });
    stripeAccountLinksCreate.mockResolvedValueOnce({ url: 'https://connect.stripe.com/onboard' });

    const res = await request(app).post('/stripe/onboard-contractor').send({ userId: 'u1' });

    expect(res.status).toBe(200);
    expect(stripeAccountsCreate).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// POST /stripe/finalize-onboarding
// ===========================================================================
describe('POST /stripe/finalize-onboarding', () => {
  const app = createApp();
  beforeEach(resetPbDefaults);

  it('returns 400 when user has no Stripe account', async () => {
    pbCol.getOne.mockResolvedValueOnce({ id: 'u1', stripeAccountId: null });
    const res = await request(app).post('/stripe/finalize-onboarding').send({ userId: 'u1' });
    expect(res.status).toBe(400);
  });

  it('marks user as onboarded when account setup is complete', async () => {
    pbCol.getOne.mockResolvedValueOnce({ id: 'u1', stripeAccountId: 'acct_123' });
    stripeAccountsRetrieve.mockResolvedValueOnce({ details_submitted: true, charges_enabled: true });

    const res = await request(app).post('/stripe/finalize-onboarding').send({ userId: 'u1' });

    expect(res.status).toBe(200);
    expect(res.body.onboarded).toBe(true);
    expect(pbCol.update).toHaveBeenCalledWith('user-1', { stripeOnboarded: true });
  });

  it('marks user as not onboarded when account setup is incomplete', async () => {
    pbCol.getOne.mockResolvedValueOnce({ id: 'u1', stripeAccountId: 'acct_123' });
    stripeAccountsRetrieve.mockResolvedValueOnce({ details_submitted: false, charges_enabled: false });

    const res = await request(app).post('/stripe/finalize-onboarding').send({ userId: 'u1' });

    expect(res.status).toBe(200);
    expect(res.body.onboarded).toBe(false);
  });
});

// ===========================================================================
// POST /stripe/request-payout
// ===========================================================================
describe('POST /stripe/request-payout', () => {
  const app = createApp();
  beforeEach(resetPbDefaults);

  it('returns 400 when amount is missing', async () => {
    const res = await request(app).post('/stripe/request-payout').send({ userId: 'u1' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when amount is not a positive number', async () => {
    const res = await request(app).post('/stripe/request-payout').send({ userId: 'u1', amount: -10 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when user is not Stripe-onboarded', async () => {
    pbCol.getOne.mockResolvedValueOnce({ ...CONTRACTOR_NO_STRIPE, balance: 200 });
    const res = await request(app).post('/stripe/request-payout').send({ userId: 'u1', amount: 50 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not connected/i);
  });

  it('returns 400 when payout amount exceeds balance', async () => {
    pbCol.getOne.mockResolvedValueOnce({ ...CONTRACTOR_STRIPE, balance: 30 });
    const res = await request(app).post('/stripe/request-payout').send({ userId: 'u1', amount: 50 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Insufficient balance/i);
  });

  it('creates a Stripe transfer and deducts balance', async () => {
    pbCol.getOne.mockResolvedValueOnce({ ...CONTRACTOR_STRIPE, balance: 100 });
    stripeTransfersCreate.mockResolvedValueOnce({ id: 'tr_abc' });

    const res = await request(app).post('/stripe/request-payout').send({ userId: 'u1', amount: 40 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, transferId: 'tr_abc', remaining: 60 });
    expect(stripeTransfersCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 4000, currency: 'eur', destination: 'acct_123' }),
    );
    expect(pbCol.update).toHaveBeenCalledWith('user-1', { balance: 60 });
  });
});

// ===========================================================================
// GET /stripe/contractor-dashboard
// ===========================================================================
describe('GET /stripe/contractor-dashboard', () => {
  const app = createApp();
  beforeEach(resetPbDefaults);

  it('returns 400 when userId is missing', async () => {
    const res = await request(app).get('/stripe/contractor-dashboard');
    expect(res.status).toBe(400);
  });

  it('returns 400 when user has no connected Stripe account', async () => {
    pbCol.getOne.mockResolvedValueOnce({ id: 'u1', stripeAccountId: null });
    const res = await request(app).get('/stripe/contractor-dashboard?userId=u1');
    expect(res.status).toBe(400);
  });

  it('returns Stripe Express dashboard login link', async () => {
    pbCol.getOne.mockResolvedValueOnce({ id: 'u1', stripeAccountId: 'acct_123' });
    stripeAccountsLogin.mockResolvedValueOnce({ url: 'https://dashboard.stripe.com/login' });

    const res = await request(app).get('/stripe/contractor-dashboard?userId=u1');
    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://dashboard.stripe.com/login');
  });
});

// ===========================================================================
// POST /stripe/webhook
// ===========================================================================
describe('POST /stripe/webhook', () => {
  const app = createApp();
  beforeEach(() => {
    resetPbDefaults();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  });

  const postWebhook = (body = '{}') =>
    request(app)
      .post('/stripe/webhook')
      .set('stripe-signature', 'sig')
      .set('content-type', 'application/json')
      .send(body);

  it('returns 400 when webhook signature is invalid', async () => {
    stripeWebhooksConstruct.mockImplementationOnce(() => { throw new Error('Invalid sig'); });
    const res = await postWebhook();
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Webhook Error/i);
  });

  // -------------------------------------------------------------------------
  describe('checkout.session.completed', () => {
    const session = {
      id: 'cs_done',
      amount_total: 10000,
      metadata: { ticketId: 'ticket-1', userId: 'user-1', contractorUserId: 'contractor-1' },
    };

    it('records payment, marks ticket Completed, and credits contractor', async () => {
      stripeWebhooksConstruct.mockReturnValueOnce({ type: 'checkout.session.completed', data: { object: session } });
      pbCol.getList.mockResolvedValueOnce({ items: [] });           // no duplicate
      pbCol.getOne.mockResolvedValueOnce({ ...CONTRACTOR_STRIPE, balance: 0 }); // contractor

      await postWebhook();

      expect(pbCol.create).toHaveBeenCalledWith(
        expect.objectContaining({ ticketId: 'ticket-1', amount: 100, status: 'completed', transactionId: 'cs_done' }),
      );
      expect(pbCol.update).toHaveBeenCalledWith('ticket-1', { status: 'Completed' });
      // 95% of €100 = €95 credited to contractor with €0 base → €95
      expect(pbCol.update).toHaveBeenCalledWith('contractor-1', { balance: 95 });
    });

    it('credits correct amount to contractor with existing balance', async () => {
      stripeWebhooksConstruct.mockReturnValueOnce({ type: 'checkout.session.completed', data: { object: session } });
      pbCol.getList.mockResolvedValueOnce({ items: [] });
      pbCol.getOne.mockResolvedValueOnce({ ...CONTRACTOR_STRIPE, balance: 50 }); // existing €50

      await postWebhook();

      // €50 + €95 = €145
      expect(pbCol.update).toHaveBeenCalledWith('contractor-1', { balance: 145 });
    });

    it('skips duplicate payment (idempotency)', async () => {
      stripeWebhooksConstruct.mockReturnValueOnce({ type: 'checkout.session.completed', data: { object: session } });
      pbCol.getList.mockResolvedValueOnce({ items: [{ id: 'pay_dup' }] }); // already recorded

      await postWebhook();

      expect(pbCol.create).not.toHaveBeenCalled();
    });

    it('returns 200 and skips processing when metadata is missing', async () => {
      stripeWebhooksConstruct.mockReturnValueOnce({
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_bad', metadata: {} } },
      });

      const res = await postWebhook();
      expect(res.status).toBe(200);
      expect(pbCol.create).not.toHaveBeenCalled();
    });

    it('falls back to ticket acceptedBid to resolve contractor when contractorUserId is empty', async () => {
      const sessionNoContractor = { ...session, metadata: { ticketId: 'ticket-1', userId: 'user-1', contractorUserId: '' } };
      stripeWebhooksConstruct.mockReturnValueOnce({ type: 'checkout.session.completed', data: { object: sessionNoContractor } });
      pbCol.getList.mockResolvedValueOnce({ items: [] });
      pbCol.getOne
        .mockResolvedValueOnce({ ...TICKET, acceptedBidId: 'bid-1' }) // ticket lookup
        .mockResolvedValueOnce(BID)                                     // bid lookup
        .mockResolvedValueOnce({ ...CONTRACTOR_STRIPE, balance: 0 }); // contractor

      await postWebhook();

      expect(pbCol.update).toHaveBeenCalledWith('contractor-1', { balance: 95 });
    });
  });

  // -------------------------------------------------------------------------
  describe('subscription lifecycle', () => {
    it('updates user plan on customer.subscription.created', async () => {
      mockPlanFromPriceId.mockReturnValueOnce({ plan: 'vip', cycle: 'monthly' });
      stripeWebhooksConstruct.mockReturnValueOnce({
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123', customer: 'cus_abc', status: 'active', cancel_at_period_end: false,
            current_period_end: Math.floor(Date.now() / 1000) + 86400,
            items: { data: [{ price: { id: 'price_vip_m' } }] },
          },
        },
      });
      pbCol.getList.mockResolvedValueOnce({ items: [{ id: 'u1' }] });

      await postWebhook();

      expect(pbCol.update).toHaveBeenCalledWith('u1', expect.objectContaining({ plan: 'vip', planCycle: 'monthly', stripeSubscriptionId: 'sub_123' }));
    });

    it('updates user plan on customer.subscription.updated', async () => {
      mockPlanFromPriceId.mockReturnValueOnce({ plan: 'vip', cycle: 'monthly' });
      stripeWebhooksConstruct.mockReturnValueOnce({
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_123', customer: 'cus_abc', status: 'active', cancel_at_period_end: true,
            current_period_end: Math.floor(Date.now() / 1000) + 86400,
            items: { data: [{ price: { id: 'price_vip_m' } }] },
          },
        },
      });
      pbCol.getList.mockResolvedValueOnce({ items: [{ id: 'u1' }] });

      await postWebhook();

      expect(pbCol.update).toHaveBeenCalledWith('u1', expect.objectContaining({ plan: 'vip' }));
    });

    it('resets plan to standard on customer.subscription.deleted', async () => {
      stripeWebhooksConstruct.mockReturnValueOnce({
        type: 'customer.subscription.deleted',
        data: { object: { id: 'sub_123', customer: 'cus_abc' } },
      });
      pbCol.getList.mockResolvedValueOnce({ items: [{ id: 'u1' }] });

      await postWebhook();

      expect(pbCol.update).toHaveBeenCalledWith('u1', expect.objectContaining({
        plan: 'standard', planCycle: '', stripeSubscriptionId: '',
      }));
    });

    it('returns 200 and skips on unrecognised price ID', async () => {
      mockPlanFromPriceId.mockReturnValueOnce(null); // unknown price
      stripeWebhooksConstruct.mockReturnValueOnce({
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_xyz', customer: 'cus_abc',
            items: { data: [{ price: { id: 'price_unknown' } }] },
          },
        },
      });

      const res = await postWebhook();
      expect(res.status).toBe(200);
      expect(pbCol.update).not.toHaveBeenCalled();
    });

    it('returns 200 for invoice.payment_failed without updating anything', async () => {
      stripeWebhooksConstruct.mockReturnValueOnce({
        type: 'invoice.payment_failed',
        data: { object: { customer: 'cus_abc', subscription: 'sub_123' } },
      });

      const res = await postWebhook();
      expect(res.status).toBe(200);
      expect(pbCol.update).not.toHaveBeenCalled();
    });
  });
});
