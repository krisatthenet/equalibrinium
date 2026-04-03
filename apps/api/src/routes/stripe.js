import express from 'express';
import Stripe from 'stripe';
import logger from '../utils/logger.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * POST /stripe/create-checkout
 * Create a Stripe Checkout Session for payment
 * Request body: { amount, ticketId, userId, paymentOption }
 * Response: { url: string }
 */
router.post('/create-checkout', async (req, res) => {
  const { amount, ticketId, userId, paymentOption } = req.body;

  // Validate required fields
  if (!amount || !ticketId || !userId || !paymentOption) {
    return res.status(400).json({
      error: 'amount, ticketId, userId, and paymentOption are required',
    });
  }

  // Validate amount is a positive number
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({
      error: 'amount must be a positive number',
    });
  }

  logger.info(`Creating Stripe checkout session for user ${userId}, ticket ${ticketId}, amount ${amount}`);

  // Create Checkout Session - throw Error if it fails
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Ticket Purchase - ${paymentOption}`,
            metadata: {
              ticketId: ticketId,
              userId: userId,
            },
          },
          unit_amount: Math.round(amount * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-cancel`,
    metadata: {
      ticketId: ticketId,
      userId: userId,
      paymentOption: paymentOption,
    },
  });

  logger.info(`Stripe checkout session created: ${session.id}`);

  res.json({
    url: session.url,
  });
});

/**
 * GET /stripe/session/:sessionId
 * Retrieve and verify payment session status
 * Response: { id, status, amountTotal, customerEmail }
 */
router.get('/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json({
      error: 'sessionId is required',
    });
  }

  logger.info(`Retrieving Stripe session: ${sessionId}`);

  // Retrieve session - throw Error if it fails
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  logger.info(`Stripe session retrieved: ${sessionId}, payment_status: ${session.payment_status}`);

  res.json({
    id: session.id,
    status: session.payment_status,
    amountTotal: session.amount_total,
    customerEmail: session.customer_details?.email || null,
  });
});

export default router;