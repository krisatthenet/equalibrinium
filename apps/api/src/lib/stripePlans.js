// Stripe price IDs for each plan tier and billing cycle.
// Populate these by running: node scripts/setup-stripe-products.js
// Then copy the output into your .env file.

export const PRICE_IDS = {
  contractor: {
    vip:     { monthly: process.env.STRIPE_PRICE_CONTRACTOR_VIP_MONTHLY,     yearly: process.env.STRIPE_PRICE_CONTRACTOR_VIP_YEARLY },
    elite:   { monthly: process.env.STRIPE_PRICE_CONTRACTOR_ELITE_MONTHLY,   yearly: process.env.STRIPE_PRICE_CONTRACTOR_ELITE_YEARLY },
    premium: { monthly: process.env.STRIPE_PRICE_CONTRACTOR_PREMIUM_MONTHLY, yearly: process.env.STRIPE_PRICE_CONTRACTOR_PREMIUM_YEARLY },
    ultra:   { monthly: process.env.STRIPE_PRICE_CONTRACTOR_ULTRA_MONTHLY,   yearly: process.env.STRIPE_PRICE_CONTRACTOR_ULTRA_YEARLY },
  },
  client: {
    vip:     { monthly: process.env.STRIPE_PRICE_CLIENT_VIP_MONTHLY,     yearly: process.env.STRIPE_PRICE_CLIENT_VIP_YEARLY },
    elite:   { monthly: process.env.STRIPE_PRICE_CLIENT_ELITE_MONTHLY,   yearly: process.env.STRIPE_PRICE_CLIENT_ELITE_YEARLY },
    premium: { monthly: process.env.STRIPE_PRICE_CLIENT_PREMIUM_MONTHLY, yearly: process.env.STRIPE_PRICE_CLIENT_PREMIUM_YEARLY },
    ultra:   { monthly: process.env.STRIPE_PRICE_CLIENT_ULTRA_MONTHLY,   yearly: process.env.STRIPE_PRICE_CLIENT_ULTRA_YEARLY },
  },
};

// Reverse lookup: priceId → { plan, cycle }
export function planFromPriceId(priceId) {
  for (const [uType, tiers] of Object.entries(PRICE_IDS)) {
    for (const [plan, cycles] of Object.entries(tiers)) {
      if (cycles.monthly === priceId) return { plan, cycle: 'monthly' };
      if (cycles.yearly  === priceId) return { plan, cycle: 'yearly'  };
    }
  }
  return null;
}

export function getPriceId(userType, plan, cycle) {
  const uType = userType === 'client' ? 'client' : 'contractor';
  return PRICE_IDS[uType]?.[plan]?.[cycle] ?? null;
}
