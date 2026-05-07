#!/usr/bin/env node
/**
 * Creates all WorkBee subscription products and prices in Stripe.
 * Run once: node scripts/setup-stripe-products.js
 * Copy the printed env vars into your .env file.
 */
import Stripe from 'stripe';
import { config } from 'dotenv';
config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const TIERS = {
  contractor: [
    { plan: 'vip',     monthly:  900, yearly:  8100 },
    { plan: 'elite',   monthly: 2400, yearly: 21600 },
    { plan: 'premium', monthly: 4900, yearly: 44100 },
    { plan: 'ultra',   monthly: 9900, yearly: 89100 },
  ],
  client: [
    { plan: 'vip',     monthly:  700, yearly:  6300 },
    { plan: 'elite',   monthly: 1800, yearly: 16200 },
    { plan: 'premium', monthly: 3500, yearly: 31500 },
    { plan: 'ultra',   monthly: 6900, yearly: 62100 },
  ],
};

const envLines = [];

for (const [userType, tiers] of Object.entries(TIERS)) {
  for (const { plan, monthly, yearly } of tiers) {
    const productName = `WorkBee ${plan.charAt(0).toUpperCase() + plan.slice(1)} — ${userType.charAt(0).toUpperCase() + userType.slice(1)}`;
    const product = await stripe.products.create({
      name: productName,
      metadata: { plan, userType },
    });

    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: monthly,
      currency: 'eur',
      recurring: { interval: 'month' },
      metadata: { plan, userType, cycle: 'monthly' },
    });

    const yearlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: yearly,
      currency: 'eur',
      recurring: { interval: 'year' },
      metadata: { plan, userType, cycle: 'yearly' },
    });

    const prefix = `STRIPE_PRICE_${userType.toUpperCase()}_${plan.toUpperCase()}`;
    envLines.push(`${prefix}_MONTHLY=${monthlyPrice.id}`);
    envLines.push(`${prefix}_YEARLY=${yearlyPrice.id}`);

    console.log(`✓ ${productName}`);
    console.log(`  monthly: ${monthlyPrice.id}`);
    console.log(`  yearly:  ${yearlyPrice.id}`);
  }
}

console.log('\n--- Copy into your .env ---');
console.log(envLines.join('\n'));
