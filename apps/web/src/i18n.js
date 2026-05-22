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

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: enTranslations,
      lt: ltTranslations,
      ru: ruTranslations,
      pl: plTranslations,
      uk: ukTranslations
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
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