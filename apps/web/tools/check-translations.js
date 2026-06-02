#!/usr/bin/env node
/**
 * Translation parity check.
 *
 * Why this exists: every time we ship a feature, the version in package.json bumps
 * by 0.001 (see BetaBadge / web-versioning-scheme). New copy is usually added to
 * en.json + lt.json first, and it is easy to forget the other languages. When a key
 * is missing, i18next silently falls back to English, so the bug is invisible until a
 * user on pl/ru/uk hits an English string.
 *
 * This script makes that impossible to miss:
 *   - ERROR (exit 1): a non-English locale is missing a key that exists in en, has
 *     an extra key that en does not, OR has a value byte-identical to en that is not
 *     on the allowlist below (i.e. copied but never translated). Blocks the build.
 *   - ALLOWED: a value may legitimately equal English — brand names, acronyms,
 *     loanwords, version strings. Those keys are listed in ALLOW_IDENTICAL.
 *
 * When a real string is intentionally identical in another language (e.g. a loanword
 * like "Portfolio" in Polish), add it to ALLOW_IDENTICAL rather than letting it slip
 * through silently. Use 'key' to allow it in every locale, or 'lang:key' for one.
 *
 * Run: npm run check:i18n  (also runs automatically in build + pretest)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const BASE = 'en'; // source of truth

// Values allowed to equal English. 'key' = any locale; 'lang:key' = one locale.
// Keep this tight: every entry is a deliberate "this word is the same in that
// language", not "haven't gotten around to translating it yet".
const ALLOW_IDENTICAL = new Set([
  'translation.beta.soft_launch', // version string, e.g. "Beta v. 0.2.0"
  'translation.settings.cvv', // card acronym
  'translation.settings.paypal', // brand
  'translation.settings.stripe', // brand
  'pl:translation.professions.Mentor', // loanword, identical in Polish
  'pl:translation.auction.status', // loanword, identical in Polish
  'pl:translation.portfolio_gallery.title', // "Portfolio" — identical in Polish
]);
const isAllowedIdentical = (lang, key) =>
  ALLOW_IDENTICAL.has(key) || ALLOW_IDENTICAL.has(`${lang}:${key}`);

const langs = fs
  .readdirSync(LOCALES_DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''));

const load = (l) => JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${l}.json`), 'utf8'));

const flatten = (obj, prefix = '', out = {}) => {
  for (const k of Object.keys(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    const v = obj[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
};

const flat = Object.fromEntries(langs.map((l) => [l, flatten(load(l))]));
const baseKeys = Object.keys(flat[BASE]);

let errors = 0;
let warnings = 0;

for (const l of langs) {
  if (l === BASE) continue;
  const keys = flat[l];
  const missing = baseKeys.filter((k) => !(k in keys));
  const extra = Object.keys(keys).filter((k) => !(k in flat[BASE]));
  const untranslated = baseKeys.filter(
    (k) =>
      k in keys &&
      typeof keys[k] === 'string' &&
      keys[k] === flat[BASE][k] &&
      keys[k].trim() !== '' &&
      !isAllowedIdentical(l, k)
  );
  const allowedSame = baseKeys.filter(
    (k) => k in keys && keys[k] === flat[BASE][k] && keys[k] !== '' && isAllowedIdentical(l, k)
  );

  if (missing.length || extra.length) {
    console.error(`\n❌ ${l}.json out of sync with ${BASE}.json`);
    missing.forEach((k) => console.error(`   MISSING : ${k}  ("${flat[BASE][k]}")`));
    extra.forEach((k) => console.error(`   EXTRA   : ${k}  (not in ${BASE})`));
    errors += missing.length + extra.length;
  }
  if (untranslated.length) {
    console.error(`\n❌ ${l}.json has ${untranslated.length} untranslated value(s) identical to ${BASE}:`);
    untranslated.forEach((k) => console.error(`   SAME    : ${k}  ("${flat[BASE][k]}")`));
    console.error(`   Translate them, or if the word is genuinely identical in ${l}, add to ALLOW_IDENTICAL.`);
    errors += untranslated.length;
  }
  if (allowedSame.length) warnings += allowedSame.length;
}

if (errors) {
  console.error(`\n💥 Translation check FAILED: ${errors} issue(s) across locales.`);
  console.error(`   Fix the key(s) in ${path.relative(process.cwd(), LOCALES_DIR)} before releasing.\n`);
  process.exit(1);
}

console.log(`\n✓ Translations in sync: ${baseKeys.length} keys × ${langs.length} locales (${langs.join(', ')}).`);
if (warnings) console.log(`  (${warnings} value(s) intentionally match English via ALLOW_IDENTICAL.)`);
