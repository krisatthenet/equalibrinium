/**
 * Seed script: creates 3 contractors, 4 clients, 1 influencer + reviews
 * Run: node scripts/seed-users.mjs
 */
import PocketBase from 'pocketbase';

const PB_URL = 'https://workbee-pocketbase-cayj-production.up.railway.app';
const ADMIN_EMAIL = 'admin@workbee.space';
const ADMIN_PASS  = 'Rapolas123!';

const pb = new PocketBase(PB_URL);

// ---------- helpers ----------

async function fetchImageBlob(url) {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const mime = res.headers.get('content-type') || 'image/jpeg';
  return new Blob([buf], { type: mime });
}

async function createUser(data, avatarUrl, portfolioUrls = []) {
  const fd = new FormData();

  for (const [k, v] of Object.entries(data)) {
    fd.append(k, String(v));
  }
  fd.append('emailVisibility', 'true');
  fd.append('verified', 'true');

  // avatar
  if (avatarUrl) {
    const blob = await fetchImageBlob(avatarUrl);
    fd.append('avatar', blob, 'avatar.jpg');
  }

  // portfolio / work examples
  for (let i = 0; i < portfolioUrls.length; i++) {
    const blob = await fetchImageBlob(portfolioUrls[i]);
    fd.append('workExamples', blob, `portfolio_${i + 1}.jpg`);
  }

  const record = await pb.collection('users').create(fd);
  console.log(`✓ Created ${data.userType} — ${data.name} (${record.id})`);
  return record;
}

async function createReview({ contractorId, clientId, rating, comment }) {
  const review = await pb.collection('reviews').create({
    contractorId, clientId, rating, comment,
  });
  console.log(`  ✓ Review ${rating}★ for ${contractorId}`);
  return review;
}

async function updateRating(contractorId) {
  const reviews = await pb.collection('reviews').getFullList({
    filter: `contractorId = "${contractorId}"`,
  });
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  await pb.collection('users').update(contractorId, {
    rating: parseFloat(avg.toFixed(2)),
    reviewCount: reviews.length,
  });
}

// ---------- data ----------

const contractors = [
  {
    data: {
      email: 'tomas.kazlauskas@seed.workbee.space',
      password: 'Workbee2025!',
      passwordConfirm: 'Workbee2025!',
      name: 'Tomas Kazlauskas',
      userType: 'contractor',
      phone: '+37061234567',
      location: 'Vilnius, Lithuania',
      profession: 'Elektrika',
      bio: 'Certified electrician with 12 years of experience. Specialise in residential rewiring, smart home installation, and fault diagnostics. Fully licensed and insured. Fast response times across Vilnius.',
      plan: 'elite',
      rating: 4.8,
      reviewCount: 0,
    },
    avatar: 'https://i.pravatar.cc/400?img=12',
    portfolio: [
      'https://picsum.photos/seed/elec1/800/600',
      'https://picsum.photos/seed/elec2/800/600',
      'https://picsum.photos/seed/elec3/800/600',
    ],
  },
  {
    data: {
      email: 'andrius.petrauskas@seed.workbee.space',
      password: 'Workbee2025!',
      passwordConfirm: 'Workbee2025!',
      name: 'Andrius Petrauskas',
      userType: 'contractor',
      phone: '+37062345678',
      location: 'Kaunas, Lithuania',
      profession: 'Santechnika',
      bio: 'Master plumber with 9 years on the tools. Boiler installations, bathroom refits, leak repairs and emergency callouts. Transparent pricing — no hidden fees. Serving Kaunas and surrounding areas.',
      plan: 'vip',
      rating: 4.6,
      reviewCount: 0,
    },
    avatar: 'https://i.pravatar.cc/400?img=33',
    portfolio: [
      'https://picsum.photos/seed/plumb1/800/600',
      'https://picsum.photos/seed/plumb2/800/600',
    ],
  },
  {
    data: {
      email: 'vaidas.stankus@seed.workbee.space',
      password: 'Workbee2025!',
      passwordConfirm: 'Workbee2025!',
      name: 'Vaidas Stankus',
      userType: 'contractor',
      phone: '+37063456789',
      location: 'Klaipėda, Lithuania',
      profession: 'Apdailos darbai',
      bio: 'Interior finishing specialist — plaster, paint, tiling, and floor laying. Meticulous attention to detail with a portfolio of 200+ completed apartments. Available weekends.',
      plan: 'premium',
      rating: 4.9,
      reviewCount: 0,
    },
    avatar: 'https://i.pravatar.cc/400?img=52',
    portfolio: [
      'https://picsum.photos/seed/finish1/800/600',
      'https://picsum.photos/seed/finish2/800/600',
      'https://picsum.photos/seed/finish3/800/600',
      'https://picsum.photos/seed/finish4/800/600',
    ],
  },
];

const clients = [
  {
    data: {
      email: 'laura.jankauskaite@seed.workbee.space',
      password: 'Workbee2025!',
      passwordConfirm: 'Workbee2025!',
      name: 'Laura Jankauskaitė',
      userType: 'client',
      phone: '+37064567890',
      location: 'Vilnius, Lithuania',
      plan: 'standard',
    },
    avatar: 'https://i.pravatar.cc/400?img=5',
  },
  {
    data: {
      email: 'mindaugas.rimkus@seed.workbee.space',
      password: 'Workbee2025!',
      passwordConfirm: 'Workbee2025!',
      name: 'Mindaugas Rimkus',
      userType: 'client',
      phone: '+37065678901',
      location: 'Kaunas, Lithuania',
      plan: 'vip',
    },
    avatar: 'https://i.pravatar.cc/400?img=68',
  },
  {
    data: {
      email: 'egle.navickaite@seed.workbee.space',
      password: 'Workbee2025!',
      passwordConfirm: 'Workbee2025!',
      name: 'Eglė Navickaitė',
      userType: 'client',
      phone: '+37066789012',
      location: 'Šiauliai, Lithuania',
      plan: 'standard',
    },
    avatar: 'https://i.pravatar.cc/400?img=47',
  },
  {
    data: {
      email: 'julius.bernotas@seed.workbee.space',
      password: 'Workbee2025!',
      passwordConfirm: 'Workbee2025!',
      name: 'Julius Bernotas',
      userType: 'client',
      phone: '+37067890123',
      location: 'Panevėžys, Lithuania',
      plan: 'elite',
    },
    avatar: 'https://i.pravatar.cc/400?img=60',
  },
];

const influencers = [
  {
    data: {
      email: 'simona.buitvydaite@seed.workbee.space',
      password: 'Workbee2025!',
      passwordConfirm: 'Workbee2025!',
      name: 'Simona Buitvydaitė',
      userType: 'influencer',
      phone: '+37068901234',
      location: 'Vilnius, Lithuania',
      instagramHandle: '@simona.builds',
      tiktokHandle: '@simonab',
      contentNiche: 'Home renovation & interior design',
      influencerBio: 'I document my home renovation journey and share tips on finding great contractors. 45K followers across Instagram and TikTok. Partnered with WorkBee to help homeowners connect with trusted professionals.',
      plan: 'elite',
    },
    avatar: 'https://i.pravatar.cc/400?img=25',
    portfolio: [
      'https://picsum.photos/seed/infl1/800/600',
      'https://picsum.photos/seed/infl2/800/600',
    ],
  },
];

const reviewTemplates = [
  { rating: 5, comment: 'Absolutely brilliant work. Showed up on time, clean and professional throughout. The finish is perfect — I could not be happier. Highly recommend to anyone.' },
  { rating: 5, comment: 'Best contractor I have ever hired. Completed the job ahead of schedule and even helped tidy up afterwards. Will definitely use again.' },
  { rating: 4, comment: 'Really good quality work. Took a little longer than expected but the result speaks for itself. Good communication throughout.' },
  { rating: 5, comment: 'Exceeded my expectations completely. Transparent pricing, no surprises. Treated my home with real care. 10/10.' },
  { rating: 4, comment: 'Solid professional. Knew exactly what he was doing, explained each step clearly. Minor delay on day 2 but sorted everything on day 3.' },
  { rating: 5, comment: 'Found through WorkBee and so glad I did. Responsive, skilled, and reasonably priced. The bathroom looks brand new.' },
  { rating: 3, comment: 'Good work overall. Communication could have been better in the middle of the project but the end result is fine.' },
  { rating: 5, comment: 'Incredibly skilled. My apartment looks like it came out of a magazine. Would refer to every friend without hesitation.' },
];

// ---------- main ----------

async function main() {
  console.log('🔑 Authenticating as admin...');
  await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASS);
  console.log('✓ Authenticated\n');

  // Create contractors
  console.log('👷 Creating contractors...');
  const createdContractors = [];
  for (const c of contractors) {
    const record = await createUser(c.data, c.avatar, c.portfolio);
    createdContractors.push(record);
  }

  // Create clients
  console.log('\n👥 Creating clients...');
  const createdClients = [];
  for (const c of clients) {
    const record = await createUser(c.data, c.avatar);
    createdClients.push(record);
  }

  // Create influencer
  console.log('\n🌟 Creating influencer...');
  for (const inf of influencers) {
    await createUser(inf.data, inf.avatar, inf.portfolio);
  }

  // Create reviews — spread across contractors
  console.log('\n⭐ Creating reviews...');
  let reviewIdx = 0;
  for (let ci = 0; ci < createdContractors.length; ci++) {
    const contractor = createdContractors[ci];
    // Each contractor gets 2-3 reviews from different clients
    const numReviews = ci === 2 ? 3 : 2;
    for (let r = 0; r < numReviews; r++) {
      const client = createdClients[(ci * 2 + r) % createdClients.length];
      const tmpl = reviewTemplates[reviewIdx % reviewTemplates.length];
      await createReview({
        contractorId: contractor.id,
        clientId: client.id,
        rating: tmpl.rating,
        comment: tmpl.comment,
      });
      reviewIdx++;
    }
    await updateRating(contractor.id);
    console.log(`  ✓ Rating updated for ${contractor.name}`);
  }

  console.log('\n✅ Seed complete!');
  console.log(`   Contractors : ${createdContractors.length}`);
  console.log(`   Clients     : ${createdClients.length}`);
  console.log(`   Influencers : ${influencers.length}`);
  console.log(`   Reviews     : ${reviewIdx}`);
}

main().catch(e => {
  console.error('❌ Seed failed:', e.message);
  process.exit(1);
});
