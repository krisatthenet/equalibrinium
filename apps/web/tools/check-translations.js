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
 *   - ERROR (exit 1): a non-English locale is missing a key that exists in en, or has
 *     an extra key that en does not. Blocks the build/release.
 *   - WARN (exit 0):  a non-English value is byte-identical to en. Usually means the
 *     string was copied but not yet translated. Allowed (some values legitimately
 *     match, e.g. "Instagram", "IBAN"), but printed so a human can eyeball them.
 *
 * Run: npm run check:i18n  (also runs automatically in build + pretest)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const BASE = 'en'; // source of truth

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
    (k) => k in keys && typeof keys[k] === 'string' && keys[k] === flat[BASE][k] && keys[k].trim() !== ''
  );

  if (missing.length || extra.length) {
    console.error(`\n❌ ${l}.json out of sync with ${BASE}.json`);
    missing.forEach((k) => console.error(`   MISSING : ${k}  ("${flat[BASE][k]}")`));
    extra.forEach((k) => console.error(`   EXTRA   : ${k}  (not in ${BASE})`));
    errors += missing.length + extra.length;
  }
  if (untranslated.length) {
    console.warn(`\n⚠️  ${l}.json has ${untranslated.length} value(s) identical to ${BASE} (likely untranslated):`);
    untranslated.forEach((k) => console.warn(`   SAME    : ${k}  ("${flat[BASE][k]}")`));
    warnings += untranslated.length;
  }
}

if (errors) {
  console.error(`\n💥 Translation check FAILED: ${errors} missing/extra key(s) across locales.`);
  console.error(`   Add the key(s) to every locale in ${path.relative(process.cwd(), LOCALES_DIR)} before releasing.\n`);
  process.exit(1);
}

console.log(`\n✓ Translations in sync: ${baseKeys.length} keys × ${langs.length} locales (${langs.join(', ')}).`);
if (warnings) console.log(`  (${warnings} value(s) match English — review if they should be translated.)`);
