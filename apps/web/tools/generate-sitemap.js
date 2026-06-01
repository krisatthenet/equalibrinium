#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://workbee.space';
// Use the server-side PocketBase URL (set on Railway); fall back to Vite's public var
const POCKETBASE_URL = process.env.POCKETBASE_URL || process.env.VITE_POCKETBASE_URL;

// Must stay in sync with apps/web/src/lib/categoryLanding.js
const CATEGORY_KEYS = [
  'plumbers', 'electricians', 'painters', 'carpenters', 'cleaners',
  'flooring', 'tile-layers', 'furniture-assembly', 'finishing-works',
  'wallpapering', 'nannies', 'tutors', 'coaches',
];
const LOCATION_KEYS = [
  'vilnius', 'kaunas', 'klaipeda', 'siauliai', 'panevezys', 'alytus', 'marijampole',
];

const STATIC_ROUTES = [
  { path: '/',               priority: '1.0', changefreq: 'weekly' },
  { path: '/masters',        priority: '0.9', changefreq: 'daily' },
  { path: '/contractors',    priority: '0.9', changefreq: 'daily' },
  { path: '/locator',        priority: '0.8', changefreq: 'weekly' },
  { path: '/pricing',        priority: '0.7', changefreq: 'monthly' },
  { path: '/register',       priority: '0.6', changefreq: 'monthly' },
  { path: '/login',          priority: '0.5', changefreq: 'monthly' },
  { path: '/contact',        priority: '0.6', changefreq: 'monthly' },
  { path: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms-of-service', priority: '0.3', changefreq: 'yearly' },
  { path: '/cookie-policy',  priority: '0.3', changefreq: 'yearly' },
];

// Country-wide service pages: /plumbers, /electricians …
const CATEGORY_ROUTES = CATEGORY_KEYS.map(cat => ({
  path: `/${cat}`, priority: '0.8', changefreq: 'weekly',
}));

// City × service pages: /plumbers-vilnius, /electricians-kaunas …
const LANDING_ROUTES = CATEGORY_KEYS.flatMap(cat =>
  LOCATION_KEYS.map(loc => ({
    path: `/${cat}-${loc}`, priority: '0.7', changefreq: 'weekly',
  })),
);

async function getAdminToken() {
  if (!POCKETBASE_URL) return null;
  const email = process.env.POCKETBASE_ADMIN_EMAIL;
  const password = process.env.POCKETBASE_ADMIN_PASSWORD;
  if (!email || !password) return null;
  try {
    const res = await fetch(`${POCKETBASE_URL}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: email, password }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token || null;
  } catch {
    return null;
  }
}

async function fetchIds(collection, filter, token) {
  if (!POCKETBASE_URL) return [];

  try {
    const params = new URLSearchParams({ fields: 'id', perPage: '500' });
    if (filter) params.set('filter', filter);

    const headers = token ? { Authorization: token } : {};
    const res = await fetch(
      `${POCKETBASE_URL}/api/collections/${collection}/records?${params}`,
      { headers },
    );
    if (!res.ok) return [];

    const data = await res.json();
    return (data.items ?? []).map(r => r.id);
  } catch {
    return [];
  }
}

function urlEntry({ loc, priority, changefreq }) {
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n');
}

async function main() {
  const token = await getAdminToken();

  const [masterIds, contractorIds] = await Promise.all([
    fetchIds('users', 'userType = "master"', token),
    fetchIds('users', 'userType = "contractor"', token),
  ]);

  const allRoutes = [
    ...STATIC_ROUTES,
    ...CATEGORY_ROUTES,
    ...LANDING_ROUTES,
  ];

  const entries = [
    ...allRoutes.map(r => urlEntry({ loc: `${BASE_URL}${r.path}`, priority: r.priority, changefreq: r.changefreq })),
    ...masterIds.map(id => urlEntry({ loc: `${BASE_URL}/master/${id}`, priority: '0.7', changefreq: 'weekly' })),
    ...contractorIds.map(id => urlEntry({ loc: `${BASE_URL}/contractor/${id}`, priority: '0.7', changefreq: 'weekly' })),
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
  ].join('\n');

  const outputPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf8');

  const landingCount = CATEGORY_ROUTES.length + LANDING_ROUTES.length;
  const total = allRoutes.length + masterIds.length + contractorIds.length;
  console.log(`✅ sitemap.xml generated (${total} URLs: ${landingCount} landing pages, ${masterIds.length} masters, ${contractorIds.length} contractors)`);
}

main();
