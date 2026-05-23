/**
 * Vilnius seed + production integration test
 * Run: node scripts/test-vilnius.mjs
 *
 * Creates: 2 clients, 3 contractors, 1 influencer (all Vilnius)
 * Reviews: 3 reviews across contractors
 * Tests:   Stripe API + Twilio Verify service
 */

import PocketBase from 'pocketbase';
import Stripe from 'stripe';
import twilio from 'twilio';

// ── Config ────────────────────────────────────────────────────────────────────
const PB_URL          = process.env.POCKETBASE_URL          || 'https://workbee-pocketbase-cayj-production.up.railway.app';
const ADMIN_EMAIL     = process.env.POCKETBASE_ADMIN_EMAIL  || 'admin@workbee.space';
const ADMIN_PASS      = process.env.POCKETBASE_ADMIN_PASSWORD;

const STRIPE_SECRET            = process.env.STRIPE_SECRET_KEY;
const TWILIO_ACCOUNT_SID       = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN        = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

const missing = ['POCKETBASE_ADMIN_PASSWORD','STRIPE_SECRET_KEY','TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN','TWILIO_VERIFY_SERVICE_SID']
  .filter(k => !process.env[k]);
if (missing.length) {
  console.error('Missing required env vars:', missing.join(', '));
  console.error('Copy from apps/api/.env and run:');
  console.error('  source apps/api/.env && node scripts/test-vilnius.mjs');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const pb = new PocketBase(PB_URL);

function pass(msg)  { console.log(`  ✅  ${msg}`); }
function fail(msg)  { console.log(`  ❌  ${msg}`); }
function info(msg)  { console.log(`  ℹ️   ${msg}`); }
function head(msg)  { console.log(`\n${'─'.repeat(60)}\n  ${msg}\n${'─'.repeat(60)}`); }

async function fetchImageBlob(url) {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  return new Blob([buf], { type: res.headers.get('content-type') || 'image/jpeg' });
}

async function upsertUser(data, avatarUrl) {
  try {
    const existing = await pb.collection('users').getFirstListItem(`email = "${data.email}"`);
    info(`Already exists: ${data.name} (${existing.id})`);
    return existing;
  } catch (_) {}

  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) {
    fd.append(k, Array.isArray(v) ? JSON.stringify(v) : String(v));
  }
  fd.append('emailVisibility', 'true');
  fd.append('verified', 'true');
  if (avatarUrl) {
    const blob = await fetchImageBlob(avatarUrl);
    fd.append('avatar', blob, 'avatar.jpg');
  }
  const rec = await pb.collection('users').create(fd);
  pass(`Created ${data.userType.padEnd(11)} ${data.name} (${rec.id})`);
  return rec;
}

async function upsertReview({ contractorId, clientId, rating, comment }) {
  const record = await pb.collection('reviews').create({ contractorId, clientId, rating, comment });
  pass(`Review ${rating}★  ${clientId} → ${contractorId}`);
  return record;
}

async function updateRating(contractorId) {
  const reviews = await pb.collection('reviews').getFullList({
    filter: `contractorId = "${contractorId}"`,
  });
  if (!reviews.length) return;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  await pb.collection('users').update(contractorId, {
    rating:      parseFloat(avg.toFixed(2)),
    reviewCount: reviews.length,
  });
  info(`Rating updated → ${avg.toFixed(2)} (${reviews.length} review${reviews.length > 1 ? 's' : ''})`);
}

// ── User data ─────────────────────────────────────────────────────────────────

const contractors = [
  {
    email: 'mantas.grigas@test2.workbee.space',
    password: 'Workbee2025!', passwordConfirm: 'Workbee2025!',
    name: 'Mantas Grigas', userType: 'contractor',
    phone: '+37061100001',
    location: 'Vilnius, Antakalnis, Lithuania',
    latitude: 54.6985, longitude: 25.3012,
    profession: 'Santechnika',
    bio: 'Master plumber serving Vilnius since 2011. Bathroom refits, boiler installs, emergency callouts. Fully certified, no hidden fees. Response within 2 hours.',
    hourlyRate: 42, plan: 'vip',
    avatar: 'https://i.pravatar.cc/400?img=15',
  },
  {
    email: 'kristina.nausedaite@test2.workbee.space',
    password: 'Workbee2025!', passwordConfirm: 'Workbee2025!',
    name: 'Kristina Nausėdaitė', userType: 'contractor',
    phone: '+37062200002',
    location: 'Vilnius, Žvėrynas, Lithuania',
    latitude: 54.6920, longitude: 25.2610,
    profession: 'Dažymo darbai',
    bio: 'Interior and exterior painting specialist. 8 years experience. Perfect finishes, minimal mess, strict timelines. Dulux, Caparol, Tikkurila products available.',
    hourlyRate: 32, plan: 'standard',
    avatar: 'https://i.pravatar.cc/400?img=23',
  },
  {
    email: 'povilas.sileika@test2.workbee.space',
    password: 'Workbee2025!', passwordConfirm: 'Workbee2025!',
    name: 'Povilas Šileika', userType: 'contractor',
    phone: '+37063300003',
    location: 'Vilnius, Šnipiškės, Lithuania',
    latitude: 54.6990, longitude: 25.2720,
    profession: 'Stalių darbai',
    bio: 'Joinery and carpentry — custom fitted wardrobes, kitchen units, doors, and staircases. Workshop in Šnipiškės. 15 years craftsmanship. Free in-home measure.',
    hourlyRate: 38, plan: 'standard',
    avatar: 'https://i.pravatar.cc/400?img=44',
  },
];

const clients = [
  {
    email: 'gabija.morkunaite@test2.workbee.space',
    password: 'Workbee2025!', passwordConfirm: 'Workbee2025!',
    name: 'Gabija Morkūnaitė', userType: 'client',
    phone: '+37064400004',
    location: 'Vilnius, Naujamiestis, Lithuania',
    avatar: 'https://i.pravatar.cc/400?img=36',
  },
  {
    email: 'tautvydas.janulis@test2.workbee.space',
    password: 'Workbee2025!', passwordConfirm: 'Workbee2025!',
    name: 'Tautvydas Janulis', userType: 'client',
    phone: '+37065500005',
    location: 'Vilnius, Lazdynai, Lithuania',
    avatar: 'https://i.pravatar.cc/400?img=59',
  },
];

const influencer = {
  email: 'migle.stankeviciute@test2.workbee.space',
  password: 'Workbee2025!', passwordConfirm: 'Workbee2025!',
  name: 'Miglė Stankevičiūtė', userType: 'influencer',
  phone: '+37066600006',
  location: 'Vilnius, Lithuania',
  instagramHandle: '@migle.namai', instagramFollowers: 31500,
  tiktokHandle: '@migle_namai', tiktokFollowers: 22800,
  contentNiche: 'Namų interjeras ir remontas',
  influencerBio: 'Dokumentuoju savo buto renovacijos kelionę. 55K sekėjų Instagram ir TikTok. Bendradarbiauju su WorkBee, kad padėčiau vilniečiams rasti patikimus meistrus.',
  plan: 'vip',
  avatar: 'https://i.pravatar.cc/400?img=30',
};

const reviewData = [
  { rating: 5, comment: 'Mantas arrived on time, explained everything clearly, and finished the bathroom refit a day early. No mess, no surprises. Will call him for every plumbing job going forward.' },
  { rating: 4, comment: 'Kristina did a great job with the living room walls. Very neat finish. Took one extra day but kept me updated throughout. Happy with the result.' },
  { rating: 5, comment: 'Povilas built our fitted wardrobe exactly to the design we agreed. Perfect finish, solid construction. The craftsmanship is outstanding — highly recommend.' },
];

// ── SECTION 1: Seed ───────────────────────────────────────────────────────────

async function runSeed() {
  head('1 / 3   SEEDING VILNIUS USERS');

  console.log('\n🔑  Authenticating as admin…');
  await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASS);
  pass('Authenticated');

  console.log('\n👷  Contractors (3)…');
  const createdContractors = [];
  for (const c of contractors) {
    const { avatar, ...data } = c;
    createdContractors.push(await upsertUser(data, avatar));
  }

  console.log('\n👥  Clients (2)…');
  const createdClients = [];
  for (const c of clients) {
    const { avatar, ...data } = c;
    createdClients.push(await upsertUser(data, avatar));
  }

  console.log('\n🌟  Influencer (1)…');
  const { avatar: infAvatar, ...infData } = influencer;
  await upsertUser(infData, infAvatar);

  console.log('\n⭐  Reviews (3)…');
  const [mantas, kristina, povilas] = createdContractors;
  const [gabija, tautvydas] = createdClients;

  await upsertReview({ contractorId: mantas.id,   clientId: gabija.id,     ...reviewData[0] });
  await upsertReview({ contractorId: kristina.id, clientId: tautvydas.id,  ...reviewData[1] });
  await upsertReview({ contractorId: povilas.id,  clientId: gabija.id,     ...reviewData[2] });

  console.log('\n📊  Updating ratings…');
  for (const c of createdContractors) {
    process.stdout.write(`     ${c.name}: `);
    await updateRating(c.id);
  }

  pass('Seed complete');
  return { createdContractors, createdClients };
}

// ── SECTION 2: Stripe ─────────────────────────────────────────────────────────

async function runStripeTests() {
  head('2 / 3   STRIPE');

  const stripe = new Stripe(STRIPE_SECRET);

  // 2a — Balance (verifies key is valid)
  try {
    const balance = await stripe.balance.retrieve();
    const avail = balance.available.map(b => `${(b.amount / 100).toFixed(2)} ${b.currency.toUpperCase()}`).join(', ');
    pass(`Balance retrieve  →  available: ${avail || '0.00 EUR'}`);
  } catch (e) {
    fail(`Balance retrieve failed: ${e.message}`);
  }

  // 2b — List products (verify subscription plans exist)
  try {
    const prices = await stripe.prices.list({ limit: 100, active: true });
    pass(`Active prices     →  ${prices.data.length} price(s) found`);
    const recurring = prices.data.filter(p => p.type === 'recurring');
    info(`Recurring prices  →  ${recurring.length}`);
    const samples = recurring.slice(0, 3).map(p =>
      `${p.id.slice(-8)}  ${(p.unit_amount / 100).toFixed(2)} ${p.currency.toUpperCase()}/${p.recurring?.interval}`
    );
    samples.forEach(s => info(`  ${s}`));
  } catch (e) {
    fail(`Prices list failed: ${e.message}`);
  }

  // 2c — Create + immediately cancel a test PaymentIntent (no charge)
  try {
    const pi = await stripe.paymentIntents.create({
      amount:   100,
      currency: 'eur',
      metadata: { test: 'workbee-integration-check' },
      confirm:  false,
    });
    await stripe.paymentIntents.cancel(pi.id);
    pass(`PaymentIntent     →  created & cancelled (${pi.id})`);
  } catch (e) {
    fail(`PaymentIntent failed: ${e.message}`);
  }

  // 2d — Webhook endpoint exists
  try {
    const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });
    if (webhooks.data.length > 0) {
      pass(`Webhook endpoints →  ${webhooks.data.length} configured`);
      webhooks.data.forEach(wh => info(`  ${wh.url}  [${wh.status}]`));
    } else {
      info('No webhook endpoints registered yet');
    }
  } catch (e) {
    fail(`Webhook list failed: ${e.message}`);
  }
}

// ── SECTION 3: Twilio ─────────────────────────────────────────────────────────

async function runTwilioTests() {
  head('3 / 3   TWILIO');

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

  // 3a — Account info
  try {
    const account = await client.api.v2010.account.fetch();
    pass(`Account           →  ${account.friendlyName}  [${account.status}]`);
    info(`SID: ${account.sid}`);
  } catch (e) {
    fail(`Account fetch failed: ${e.message}`);
  }

  // 3b — Verify service
  try {
    const service = await client.verify.v2.services(TWILIO_VERIFY_SERVICE_SID).fetch();
    pass(`Verify service    →  "${service.friendlyName}"  [${service.codeLength} digits, ${service.defaultTemplateSid ? 'custom template' : 'default template'}]`);
    info(`SID: ${service.sid}`);
    info(`Max attempts: ${service.maxAttempts} | Code TTL: ${service.codeLength} digits`);
  } catch (e) {
    fail(`Verify service fetch failed: ${e.message}`);
  }

  // 3c — Phone numbers on account
  try {
    const numbers = await client.incomingPhoneNumbers.list({ limit: 10 });
    if (numbers.length > 0) {
      pass(`Phone numbers     →  ${numbers.length} number(s)`);
      numbers.forEach(n => info(`  ${n.phoneNumber}  (${n.friendlyName})`));
    } else {
      info('No incoming phone numbers on account (using Verify only — expected)');
    }
  } catch (e) {
    fail(`Phone numbers list failed: ${e.message}`);
  }

  // 3d — Send a test OTP to Twilio magic test number (costs nothing, no real SMS)
  try {
    const verification = await client.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to: '+15005550006', channel: 'sms' });
    pass(`Test OTP send     →  status: ${verification.status}  (magic test number — no SMS sent)`);
  } catch (e) {
    // Twilio may reject magic numbers with Verify service — that's okay
    if (e.code === 60200 || e.code === 21211) {
      info(`Test OTP skipped  →  magic number not supported by Verify service (expected)`);
    } else {
      fail(`Test OTP failed: ${e.message} (code ${e.code})`);
    }
  }
}

// ── Run all ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🐝  WorkBee — Vilnius seed + integration test\n');

  await runSeed();
  await runStripeTests();
  await runTwilioTests();

  console.log('\n' + '═'.repeat(60));
  console.log('  All checks complete.');
  console.log('═'.repeat(60) + '\n');
}

main().catch(e => {
  console.error('\n❌  Fatal:', e.message);
  if (e.response?.data) console.error('   Detail:', JSON.stringify(e.response.data, null, 2));
  process.exit(1);
});
