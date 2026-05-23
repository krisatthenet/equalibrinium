/**
 * Seed script: creates contractors, clients, influencer, tickets, bids, reviews
 * Run: node scripts/seed-users.mjs
 *
 * Requires: npm install pocketbase  (in repo root or scripts/)
 */
import PocketBase from 'pocketbase';

const PB_URL     = 'https://workbee-pocketbase-cayj-production.up.railway.app';
const ADMIN_EMAIL = 'admin@workbee.space';
const ADMIN_PASS  = 'Rapolas123!';

const pb = new PocketBase(PB_URL);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchImageBlob(url) {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const mime = res.headers.get('content-type') || 'image/jpeg';
  return new Blob([buf], { type: mime });
}

async function createUser(data, avatarUrl, portfolioUrls = []) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) {
    if (Array.isArray(v)) {
      v.forEach(item => fd.append(k, item));
    } else {
      fd.append(k, String(v));
    }
  }
  fd.append('emailVisibility', 'true');
  fd.append('verified', 'true');

  if (avatarUrl) {
    const blob = await fetchImageBlob(avatarUrl);
    fd.append('avatar', blob, 'avatar.jpg');
  }

  for (let i = 0; i < portfolioUrls.length; i++) {
    const blob = await fetchImageBlob(portfolioUrls[i]);
    fd.append('workExamples', blob, `portfolio_${i + 1}.jpg`);
  }

  const record = await pb.collection('users').create(fd);
  console.log(`  ✓ ${data.userType.padEnd(12)} ${data.name} (${record.id})`);
  return record;
}

async function createTicket(data) {
  const record = await pb.collection('auction_tickets').create(data);
  console.log(`  ✓ Ticket [${data.status}] "${data.description?.slice(0, 50)}…" (${record.id})`);
  return record;
}

async function createBid(data) {
  const record = await pb.collection('bids').create(data);
  console.log(`  ✓ Bid €${data.proposedRate} by ${data.masterId} on ${data.ticketId}`);
  return record;
}

async function acceptBid(ticket, bid) {
  await pb.collection('auction_tickets').update(ticket.id, {
    acceptedBidId: bid.id,
    status: 'In Progress',
  });
  await pb.collection('bids').update(bid.id, { status: 'accepted' });
  console.log(`  ✓ Bid ${bid.id} accepted → ticket now "In Progress"`);
}

async function createReview({ masterId, clientId, ticketId, rating, comment }) {
  const record = await pb.collection('reviews').create({
    masterId, clientId, ticketId, rating, comment,
  });
  console.log(`  ✓ Review ${rating}★ from ${clientId} → contractor ${masterId}`);
  return record;
}

async function updateRating(contractorId) {
  const reviews = await pb.collection('reviews').getFullList({
    filter: `masterId = "${contractorId}"`,
  });
  if (!reviews.length) return;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  await pb.collection('users').update(contractorId, {
    rating:      parseFloat(avg.toFixed(2)),
    reviewCount: reviews.length,
  });
  console.log(`  ✓ Rating updated → ${avg.toFixed(2)} (${reviews.length} reviews)`);
}

async function getCategories() {
  const cats = await pb.collection('categories').getFullList();
  const map = {};
  for (const c of cats) map[c.name.toLowerCase()] = c.id;
  return map;
}

// ---------------------------------------------------------------------------
// Data — contractors
// ---------------------------------------------------------------------------

const contractors = [
  {
    data: {
      email:       'tomas.kazlauskas@seed.workbee.space',
      password:    'Workbee2025!',
      passwordConfirm: 'Workbee2025!',
      name:        'Tomas Kazlauskas',
      userType:    'contractor',
      phone:       '+37061234567',
      location:    'Vilnius, Lithuania',
      latitude:    54.6872,
      longitude:   25.2797,
      profession:  'Elektrika',
      bio:         'Certified electrician with 12 years of experience. Specialise in residential rewiring, smart home installation, and fault diagnostics. Fully licensed and insured. Fast response times across Vilnius.',
      hourlyRate:  45,
      plan:        'vip',
    },
    avatar:    'https://i.pravatar.cc/400?img=12',
    portfolio: [
      'https://picsum.photos/seed/elec1/800/600',
      'https://picsum.photos/seed/elec2/800/600',
      'https://picsum.photos/seed/elec3/800/600',
    ],
  },
  {
    data: {
      email:       'andrius.petrauskas@seed.workbee.space',
      password:    'Workbee2025!',
      passwordConfirm: 'Workbee2025!',
      name:        'Andrius Petrauskas',
      userType:    'contractor',
      phone:       '+37062345678',
      location:    'Kaunas, Lithuania',
      latitude:    54.8985,
      longitude:   23.9036,
      profession:  'Santechnika',
      bio:         'Master plumber with 9 years on the tools. Boiler installations, bathroom refits, leak repairs and emergency callouts. Transparent pricing — no hidden fees. Serving Kaunas and surrounding areas.',
      hourlyRate:  40,
      plan:        'vip',
    },
    avatar:    'https://i.pravatar.cc/400?img=33',
    portfolio: [
      'https://picsum.photos/seed/plumb1/800/600',
      'https://picsum.photos/seed/plumb2/800/600',
    ],
  },
  {
    data: {
      email:       'vaidas.stankus@seed.workbee.space',
      password:    'Workbee2025!',
      passwordConfirm: 'Workbee2025!',
      name:        'Vaidas Stankus',
      userType:    'contractor',
      phone:       '+37063456789',
      location:    'Klaipėda, Lithuania',
      latitude:    55.7033,
      longitude:   21.1443,
      profession:  'Apdailos darbai',
      bio:         'Interior finishing specialist — plaster, paint, tiling, and floor laying. Meticulous attention to detail with a portfolio of 200+ completed apartments. Available weekends.',
      hourlyRate:  35,
      plan:        'standard',
    },
    avatar:    'https://i.pravatar.cc/400?img=52',
    portfolio: [
      'https://picsum.photos/seed/finish1/800/600',
      'https://picsum.photos/seed/finish2/800/600',
      'https://picsum.photos/seed/finish3/800/600',
      'https://picsum.photos/seed/finish4/800/600',
    ],
  },
  {
    data: {
      email:       'rimas.zukauskas@seed.workbee.space',
      password:    'Workbee2025!',
      passwordConfirm: 'Workbee2025!',
      name:        'Rimas Žukauskas',
      userType:    'contractor',
      phone:       '+37064111222',
      location:    'Vilnius, Lithuania',
      latitude:    54.6761,
      longitude:   25.2791,
      profession:  'Stogų dengimas',
      bio:         'Roofing contractor specialising in flat and pitched roofs. 15 years experience across residential and commercial projects. Emergency leak repairs available 24/7.',
      hourlyRate:  55,
      plan:        'standard',
    },
    avatar:    'https://i.pravatar.cc/400?img=57',
    portfolio: [
      'https://picsum.photos/seed/roof1/800/600',
      'https://picsum.photos/seed/roof2/800/600',
    ],
  },
  {
    data: {
      email:       'darius.mockus@seed.workbee.space',
      password:    'Workbee2025!',
      passwordConfirm: 'Workbee2025!',
      name:        'Darius Mockus',
      userType:    'contractor',
      phone:       '+37065222333',
      location:    'Šiauliai, Lithuania',
      latitude:    55.9349,
      longitude:   23.3137,
      profession:  'Grindys ir parketas',
      bio:         'Flooring expert — hardwood, laminate, vinyl, and tile. Sand, stain, and lacquer existing floors back to life. 10+ years. Free consultation and quote within 24h.',
      hourlyRate:  38,
      plan:        'standard',
    },
    avatar:    'https://i.pravatar.cc/400?img=67',
    portfolio: [
      'https://picsum.photos/seed/floor1/800/600',
      'https://picsum.photos/seed/floor2/800/600',
      'https://picsum.photos/seed/floor3/800/600',
    ],
  },
];

// ---------------------------------------------------------------------------
// Data — clients
// ---------------------------------------------------------------------------

const clients = [
  {
    data: {
      email:       'laura.jankauskaite@seed.workbee.space',
      password:    'Workbee2025!',
      passwordConfirm: 'Workbee2025!',
      name:        'Laura Jankauskaitė',
      userType:    'client',
      phone:       '+37066567890',
      location:    'Vilnius, Lithuania',
    },
    avatar: 'https://i.pravatar.cc/400?img=5',
  },
  {
    data: {
      email:       'mindaugas.rimkus@seed.workbee.space',
      password:    'Workbee2025!',
      passwordConfirm: 'Workbee2025!',
      name:        'Mindaugas Rimkus',
      userType:    'client',
      phone:       '+37067678901',
      location:    'Kaunas, Lithuania',
    },
    avatar: 'https://i.pravatar.cc/400?img=68',
  },
  {
    data: {
      email:       'egle.navickaite@seed.workbee.space',
      password:    'Workbee2025!',
      passwordConfirm: 'Workbee2025!',
      name:        'Eglė Navickaitė',
      userType:    'client',
      phone:       '+37068789012',
      location:    'Šiauliai, Lithuania',
    },
    avatar: 'https://i.pravatar.cc/400?img=47',
  },
  {
    data: {
      email:       'julius.bernotas@seed.workbee.space',
      password:    'Workbee2025!',
      passwordConfirm: 'Workbee2025!',
      name:        'Julius Bernotas',
      userType:    'client',
      phone:       '+37069890123',
      location:    'Panevėžys, Lithuania',
    },
    avatar: 'https://i.pravatar.cc/400?img=60',
  },
  {
    data: {
      email:       'inga.vaitkute@seed.workbee.space',
      password:    'Workbee2025!',
      passwordConfirm: 'Workbee2025!',
      name:        'Inga Vaitkutė',
      userType:    'client',
      phone:       '+37061000111',
      location:    'Klaipėda, Lithuania',
    },
    avatar: 'https://i.pravatar.cc/400?img=9',
  },
];

// ---------------------------------------------------------------------------
// Data — influencers
// ---------------------------------------------------------------------------

const influencers = [
  {
    data: {
      email:       'simona.buitvydaite@seed.workbee.space',
      password:    'Workbee2025!',
      passwordConfirm: 'Workbee2025!',
      name:        'Simona Buitvydaitė',
      userType:    'influencer',
      phone:       '+37062000222',
      location:    'Vilnius, Lithuania',
      instagramHandle:    '@simona.builds',
      tiktokHandle:       '@simonab',
      instagramFollowers: 28000,
      tiktokFollowers:    17000,
      contentNiche:   'Home renovation & interior design',
      influencerBio:  'I document my home renovation journey and share tips on finding great contractors. 45K followers across Instagram and TikTok. Partnered with WorkBee to help homeowners connect with trusted professionals.',
      plan:           'vip',
    },
    avatar:    'https://i.pravatar.cc/400?img=25',
    portfolio: [
      'https://picsum.photos/seed/infl1/800/600',
      'https://picsum.photos/seed/infl2/800/600',
    ],
  },
];

// ---------------------------------------------------------------------------
// Data — review templates
// ---------------------------------------------------------------------------

const reviewTemplates = [
  { rating: 5, comment: 'Absolutely brilliant work. Showed up on time, clean and professional throughout. The finish is perfect — could not be happier.' },
  { rating: 5, comment: 'Best contractor I have hired. Completed the job ahead of schedule and even helped tidy up afterwards. Will use again.' },
  { rating: 4, comment: 'Really good quality. Took a little longer than expected but the result speaks for itself. Good communication throughout.' },
  { rating: 5, comment: 'Exceeded expectations. Transparent pricing, no surprises. Treated my home with real care. 10/10.' },
  { rating: 4, comment: 'Solid professional. Knew exactly what he was doing, explained each step clearly. Minor delay but sorted everything promptly.' },
  { rating: 5, comment: 'Found through WorkBee and so glad I did. Responsive, skilled, and reasonably priced. The bathroom looks brand new.' },
  { rating: 4, comment: 'Good work overall. Communication could have been slightly better mid-project but the end result is great.' },
  { rating: 5, comment: 'Incredibly skilled. My apartment looks like it came out of a magazine. Would refer to every friend without hesitation.' },
  { rating: 5, comment: 'Punctual, tidy, and very fairly priced. Explained everything clearly before starting. Could not fault the experience.' },
  { rating: 4, comment: 'Happy with the result. Took a couple of extra days but stayed in touch throughout. Quality of work is excellent.' },
  { rating: 5, comment: 'Transformed our living room completely. Attention to detail is remarkable. Highly recommended.' },
  { rating: 3, comment: 'Decent work but a bit slow to respond to messages. Final result is acceptable though.' },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🔑 Authenticating as admin...');
  await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASS);
  console.log('✓ Authenticated\n');

  // Fetch categories so we can reference them
  console.log('📂 Fetching categories...');
  const cats = await getCategories();
  console.log('  Available:', Object.keys(cats).join(', ') || '(none — tickets will use placeholder)');
  const elecCat    = cats['elektra'] || cats['electrical'] || cats['elektrika'] || Object.values(cats)[0] || 'cat1';
  const plumbCat   = cats['santechnika'] || cats['plumbing']   || Object.values(cats)[1] || elecCat;
  const finishCat  = cats['apdaila'] || cats['finishing'] || cats['remontas'] || Object.values(cats)[2] || elecCat;
  const roofCat    = cats['stogas'] || cats['roofing'] || Object.values(cats)[3] || elecCat;
  const floorCat   = cats['grindys'] || cats['flooring'] || Object.values(cats)[4] || elecCat;

  // ---------- Users ----------

  console.log('\n👷 Creating contractors...');
  const createdContractors = [];
  for (const c of contractors) {
    createdContractors.push(await createUser(c.data, c.avatar, c.portfolio));
  }

  console.log('\n👥 Creating clients...');
  const createdClients = [];
  for (const c of clients) {
    createdClients.push(await createUser(c.data, c.avatar));
  }

  console.log('\n🌟 Creating influencers...');
  for (const inf of influencers) {
    await createUser(inf.data, inf.avatar, inf.portfolio);
  }

  const [tomas, andrius, vaidas, rimas, darius] = createdContractors;
  const [laura, mindaugas, egle, julius, inga]  = createdClients;

  // ---------- Auction Tickets ----------

  console.log('\n🎫 Creating auction tickets...');

  const t1 = await createTicket({
    clientId:         laura.id,
    categoryId:       elecCat,
    description:      'Full electrical rewire of a 3-bedroom apartment in Vilnius Old Town. Fuse box replacement, new sockets throughout, smart switches in living room and bedroom. Certificate of compliance required on completion.',
    budget:           1200,
    location:         'Vilnius Old Town, Lithuania',
    latitude:         54.6835,
    longitude:        25.2879,
    durationEstimate: '3 days',
    status:           'Completed',
  });

  const t2 = await createTicket({
    clientId:         mindaugas.id,
    categoryId:       plumbCat,
    description:      'Complete bathroom refit — new shower tray, mixer, radiator, sink and toilet. Remove old cast iron bath. Tiles supplied by client, contractor to fit. Kaunas city centre apartment, 2nd floor.',
    budget:           900,
    location:         'Kaunas, Lithuania',
    latitude:         54.8985,
    longitude:        23.9036,
    durationEstimate: '2 days',
    status:           'In Progress',
  });

  const t3 = await createTicket({
    clientId:         egle.id,
    categoryId:       finishCat,
    description:      'Paint and plaster entire 2-bedroom flat post-renovation. Walls and ceilings. Client supplies paint (Dulux White 3L). Approx. 75 sqm. Work to be completed within one week.',
    budget:           600,
    location:         'Šiauliai, Lithuania',
    latitude:         55.9349,
    longitude:        23.3137,
    durationEstimate: '4 days',
    status:           'Open',
  });

  const t4 = await createTicket({
    clientId:         julius.id,
    categoryId:       roofCat,
    description:      'Flat roof repair on a detached garage. Approx 40 sqm. Suspected membrane puncture causing leak into garage ceiling. Needs full inspection, repair or replacement if necessary.',
    budget:           500,
    location:         'Panevėžys, Lithuania',
    latitude:         55.7349,
    longitude:        24.3572,
    durationEstimate: '1 day',
    status:           'Open',
  });

  const t5 = await createTicket({
    clientId:         inga.id,
    categoryId:       floorCat,
    description:      'Sand and re-lacquer original oak hardwood floors across living room and hallway. Approx 55 sqm total. Floors are in fair condition — minor scratches and dull areas. Three coats matte lacquer preferred.',
    budget:           700,
    location:         'Klaipėda, Lithuania',
    latitude:         55.7033,
    longitude:        21.1443,
    durationEstimate: '2 days',
    status:           'Open',
  });

  const t6 = await createTicket({
    clientId:         laura.id,
    categoryId:       plumbCat,
    description:      'Emergency — kitchen sink blocked and water backing up into dishwasher. Likely blockage in shared stack. Need someone same-day or next morning.',
    budget:           120,
    location:         'Vilnius, Lithuania',
    latitude:         54.6872,
    longitude:        25.2797,
    durationEstimate: '2–3 hours',
    status:           'Completed',
  });

  // ---------- Bids ----------

  console.log('\n💬 Creating bids...');

  // t1 — Completed electrical job (laura ← tomas won it)
  const b1 = await createBid({ ticketId: t1.id, masterId: tomas.id,   proposedRate: 1100, message: 'I can start Monday. Full rewire including certificate. All materials extra unless specified otherwise.',   status: 'accepted' });
  const b2 = await createBid({ ticketId: t1.id, masterId: rimas.id,   proposedRate: 1250, message: 'Happy to take this on. I can do the full job including compliance cert. Available from Wednesday.',           status: 'rejected' });

  // t2 — In Progress plumbing (mindaugas ← andrius won it)
  const b3 = await createBid({ ticketId: t2.id, masterId: andrius.id, proposedRate:  850, message: 'Bathroom refits are my speciality. I have done 30+ in Kaunas. Can start Thursday.',                          status: 'accepted' });
  const b4 = await createBid({ ticketId: t2.id, masterId: vaidas.id,  proposedRate:  920, message: 'I can do this. Have all required tools. Would need half day extra for grouting to cure properly.',              status: 'rejected' });

  // t3 — Open finishing job (multiple bids)
  const b5 = await createBid({ ticketId: t3.id, masterId: vaidas.id,  proposedRate:  550, message: 'Plastering and painting is my bread and butter. 4 days is realistic. References available on request.',       status: 'pending' });
  const b6 = await createBid({ ticketId: t3.id, masterId: darius.id,  proposedRate:  580, message: 'Can do. I usually take slightly longer to get a perfect finish but clients always appreciate it.',              status: 'pending' });

  // t4 — Open roofing (one bid so far)
  const b7 = await createBid({ ticketId: t4.id, masterId: rimas.id,   proposedRate:  450, message: 'I specialise in flat roofs. Will inspect and advise — if membrane needs full replacement I will quote separately.', status: 'pending' });

  // t5 — Open flooring (one bid)
  const b8 = await createBid({ ticketId: t5.id, masterId: darius.id,  proposedRate:  650, message: 'Oak floor restoration is what I do best. Three coats matte lacquer, first coat tomorrow if you confirm today.', status: 'pending' });

  // t6 — Completed emergency plumbing (laura ← andrius)
  const b9 = await createBid({ ticketId: t6.id, masterId: andrius.id, proposedRate:  110, message: 'I can be there in 2 hours. Emergency callouts are an extra €15 but I will waive it for a simple blockage.',    status: 'accepted' });

  // Set acceptedBidId on completed / in-progress tickets
  console.log('\n🔗 Linking accepted bids...');
  await acceptBid(t1, b1);
  await acceptBid(t2, b3);
  // t6 completed — mark ticket status Completed (already set, just link bid)
  await pb.collection('auction_tickets').update(t6.id, { acceptedBidId: b9.id, status: 'Completed' });
  await pb.collection('bids').update(b9.id, { status: 'accepted' });
  console.log(`  ✓ Emergency ticket ${t6.id} marked Completed`);

  // Reject the other bids on won tickets
  for (const bid of [b2, b4]) {
    await pb.collection('bids').update(bid.id, { status: 'rejected' });
  }

  // ---------- Reviews ----------

  console.log('\n⭐ Creating reviews...');

  let ri = 0;
  const reviewPairs = [
    // tomas (electrician) — t1 completed
    { masterId: tomas.id,   clientId: laura.id,    ticketId: t1.id },
    { masterId: tomas.id,   clientId: julius.id,   ticketId: null  },
    { masterId: tomas.id,   clientId: mindaugas.id,ticketId: null  },

    // andrius (plumber) — t6 completed
    { masterId: andrius.id, clientId: laura.id,    ticketId: t6.id },
    { masterId: andrius.id, clientId: egle.id,     ticketId: null  },

    // vaidas (finishing)
    { masterId: vaidas.id,  clientId: egle.id,     ticketId: null  },
    { masterId: vaidas.id,  clientId: inga.id,     ticketId: null  },
    { masterId: vaidas.id,  clientId: julius.id,   ticketId: null  },

    // rimas (roofing)
    { masterId: rimas.id,   clientId: mindaugas.id,ticketId: null  },
    { masterId: rimas.id,   clientId: julius.id,   ticketId: null  },

    // darius (flooring)
    { masterId: darius.id,  clientId: inga.id,     ticketId: null  },
    { masterId: darius.id,  clientId: laura.id,    ticketId: null  },
  ];

  for (const pair of reviewPairs) {
    const tmpl = reviewTemplates[ri % reviewTemplates.length];
    await createReview({ ...pair, rating: tmpl.rating, comment: tmpl.comment });
    ri++;
  }

  // Recalculate ratings for all contractors
  console.log('\n📊 Recalculating contractor ratings...');
  for (const c of createdContractors) {
    process.stdout.write(`  ${c.name}: `);
    await updateRating(c.id);
  }

  // ---------- Summary ----------

  const openTickets      = [t3, t4, t5].length;
  const inProgressTickets = [t2].length;
  const completedTickets  = [t1, t6].length;

  console.log('\n✅  Seed complete!');
  console.log('   ┌──────────────────────────┬──────┐');
  console.log(`   │ Contractors              │  ${createdContractors.length.toString().padStart(3)} │`);
  console.log(`   │ Clients                  │  ${createdClients.length.toString().padStart(3)} │`);
  console.log(`   │ Influencers              │    1 │`);
  console.log(`   │ Auction tickets          │  ${(openTickets + inProgressTickets + completedTickets).toString().padStart(3)} │`);
  console.log(`   │   Open                   │  ${openTickets.toString().padStart(3)} │`);
  console.log(`   │   In Progress            │  ${inProgressTickets.toString().padStart(3)} │`);
  console.log(`   │   Completed              │  ${completedTickets.toString().padStart(3)} │`);
  console.log(`   │ Bids                     │  ${[b1,b2,b3,b4,b5,b6,b7,b8,b9].length.toString().padStart(3)} │`);
  console.log(`   │ Reviews                  │  ${reviewPairs.length.toString().padStart(3)} │`);
  console.log('   └──────────────────────────┴──────┘');
  console.log(`\n   PocketBase: ${PB_URL}`);
}

main().catch(e => {
  console.error('\n❌ Seed failed:', e.message);
  if (e.response?.data) console.error('   Detail:', JSON.stringify(e.response.data, null, 2));
  process.exit(1);
});
