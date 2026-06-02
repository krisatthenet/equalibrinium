import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import ltTranslations from './locales/lt.json';
import ruTranslations from './locales/ru.json';
import plTranslations from './locales/pl.json';
import ukTranslations from './locales/uk.json';

const COUNTRY_LANG = {
  LT: 'lt',
  PL: 'pl',
  RU: 'ru',
  UA: 'uk',
  BY: 'ru',
};

const resources = {
  en: enTranslations,
  lt: ltTranslations,
  ru: ruTranslations,
  pl: plTranslations,
  uk: ukTranslations
};

// --- Pseudo-locale (dev-only QA aid) -----------------------------------------
// Activate with ?lng=zz (or run window.__pseudo() in the console). Every string
// that goes through t() is accented and wrapped in ⟦…⟧ markers, so anything that
// renders as plain, un-bracketed English on screen is a leak: either a literal
// the lint rule missed/ignored, or English coming from the backend. This is the
// fastest way to eyeball-audit the whole app for untranslated copy.
// Stripped from production bundles (the import.meta.env.DEV block is dead code
// there and tree-shaken away).
if (import.meta.env.DEV) {
  const ACCENT = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú', n: 'ñ', c: 'ç', s: 'š', y: 'ý' };
  const pseudoStr = (s) =>
    '⟦' +
    // Keep {{interpolations}} and <tags>/<0>placeholders intact so React/i18next
    // formatting still works; only accent the literal text around them.
    s
      .split(/(\{\{[^}]+\}\}|<[^>]*>)/g)
      .map((part) => (/^(\{\{|<)/.test(part) ? part : part.replace(/[a-zA-Z]/g, (ch) => ACCENT[ch] || ch)))
      .join('') +
    '⟧';
  const pseudoize = (v) =>
    Array.isArray(v)
      ? v.map(pseudoize)
      : v && typeof v === 'object'
        ? Object.fromEntries(Object.entries(v).map(([k, val]) => [k, pseudoize(val)]))
        : typeof v === 'string'
          ? pseudoStr(v)
          : v;
  resources.zz = pseudoize(enTranslations);
  window.__pseudo = () => i18n.changeLanguage('zz');
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    // 'zz' is dev-only; never let it pass language validation in production.
    supportedLngs: import.meta.env.DEV ? ['en', 'lt', 'ru', 'pl', 'uk', 'zz'] : ['en', 'lt', 'ru', 'pl', 'uk'],
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false
    },
    detection: {
      // 'querystring' first so ?lng=zz (or ?lng=pl) can force a language for QA.
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lng',
      caches: ['localStorage']
    }
  });

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

document.documentElement.lang = i18n.language;

// Only run geo-detection if the user hasn't explicitly chosen a language
if (!localStorage.getItem('i18nextLng')) {
  fetch('https://ipapi.co/json/')
    .then(r => r.json())
    .then(({ country_code }) => {
      const lang = COUNTRY_LANG[country_code];
      if (lang) i18n.changeLanguage(lang);
    })
    .catch(() => {});
}

export default i18n;