/**
 * Creates all WorkBee subscription products & prices in the current Stripe account.
 * Run: node scripts/setup-stripe-products.mjs
 *
 * Safe to re-run — looks up existing products by metadata before creating.
 * Outputs the complete .env block to paste into apps/api/.env and Railway.
 */

import Stripe from 'stripe';

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET) {
  console.error('Error: STRIPE_SECRET_KEY env var is required');
  console.error('Run: STRIPE_SECRET_KEY=sk_test_... node scripts/setup-stripe-products.mjs');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET);

// ── Plan matrix (from apps/web/src/lib/plans.js) ──────────────────────────────
const PLANS = [
  {
    key: 'vip',
    name: 'VIP',
    contractor: { monthly: 900,  yearly: 8100  },  // cents
    client:     { monthly: 700,  yearly: 6300  },
  },
  {
    key: 'elite',
    name: 'Elite',
    contractor: { monthly: 2400, yearly: 21600 },
    client:     { monthly: 1800, yearly: 16200 },
  },
  {
    key: 'premium',
    name: 'Premium',
    contractor: { monthly: 4900, yearly: 44100 },
    client:     { monthly: 3500, yearly: 31500 },
  },
  {
    key: 'ultra',
    name: 'Ultra',
    contractor: { monthly: 9900, yearly: 89100 },
    client:     { monthly: 6900, yearly: 62100 },
  },
];

const USER_TYPES = ['contractor', 'client'];

function fmtEur(cents) {
  return `€${(cents / 100).toFixed(2)}`;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function getOrCreateProduct(userType, plan) {
  const metaKey = `wb_${userType}_${plan.key}`;

  // Search existing products by metadata
  const existing = await stripe.products.search({
    query: `metadata['wb_key']:'${metaKey}'`,
    limit: 1,
  }).catch(() => ({ data: [] }));

  if (existing.data.length > 0) {
    const p = existing.data[0];
    console.log(`  ↩ Product exists: ${p.name} (${p.id})`);
    return p;
  }

  const product = await stripe.products.create({
    name: `WorkBee ${userType.charAt(0).toUpperCase() + userType.slice(1)} — ${plan.name}`,
    metadata: { wb_key: metaKey, wb_user_type: userType, wb_plan: plan.key },
    statement_descriptor: `WORKBEE ${plan.name.toUpperCase()}`,
  });
  console.log(`  ✓ Created product: ${product.name} (${product.id})`);
  return product;
}

async function getOrCreatePrice(productId, amount, interval, metaKey) {
  // Search for existing price by metadata
  const existing = await stripe.prices.search({
    query: `metadata['wb_key']:'${metaKey}'`,
    limit: 1,
  }).catch(() => ({ data: [] }));

  if (existing.data.length > 0) {
    const p = existing.data[0];
    console.log(`    ↩ Price exists: ${fmtEur(p.unit_amount)}/${interval} (${p.id})`);
    return p;
  }

  const price = await stripe.prices.create({
    product:    productId,
    unit_amount: amount,
    currency:   'eur',
    recurring:  { interval },
    metadata:   { wb_key: metaKey },
  });
  console.log(`    ✓ Created price: ${fmtEur(amount)}/${interval} (${price.id})`);
  return price;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🐝  WorkBee — Stripe product setup\n');
  console.log(`Account: ${STRIPE_SECRET.includes('_test_') ? 'TEST MODE ✓' : '⚠️  LIVE MODE'}\n`);

  const envLines = [];

  for (const userType of USER_TYPES) {
    console.log(`\n── ${userType.toUpperCase()} PLANS ──`);

    for (const plan of PLANS) {
      console.log(`\n  ${plan.name}:`);

      const product = await getOrCreateProduct(userType, plan);

      const monthlyPrice = await getOrCreatePrice(
        product.id,
        plan[userType].monthly,
        'month',
        `wb_${userType}_${plan.key}_monthly`
      );

      const yearlyPrice = await getOrCreatePrice(
        product.id,
        plan[userType].yearly,
        'year',
        `wb_${userType}_${plan.key}_yearly`
      );

      const varBase = `STRIPE_PRICE_${userType.toUpperCase()}_${plan.key.toUpperCase()}`;
      envLines.push(`${varBase}_MONTHLY=${monthlyPrice.id}`);
      envLines.push(`${varBase}_YEARLY=${yearlyPrice.id}`);
    }
  }

  // ── Output ─────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(65));
  console.log('  Copy these into apps/api/.env  AND  Railway → API service env:\n');
  console.log(envLines.join('\n'));
  console.log('\n' + '═'.repeat(65));
  console.log('\n✅  Done.\n');
}

main().catch(e => {
  console.error('\n❌  Fatal:', e.message);
  process.exit(1);
});
