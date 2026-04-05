/// <reference path="../pb_data/types.d.ts" />

// Balance is updated by the Stripe webhook handler in the Node.js API,
// which correctly applies the platform fee and handles Stripe Connect.
// This hook is intentionally left empty to avoid double-crediting.
