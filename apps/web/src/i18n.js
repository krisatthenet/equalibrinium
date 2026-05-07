import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import ltTranslations from './locales/lt.json';
import ruTranslations from './locales/ru.json';
import plTranslations from './locales/pl.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: enTranslations,
      lt: ltTranslations,
      ru: ruTranslations,
      pl: plTranslations
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

// LanguageDetector runs synchronously, so language is already resolved here
document.documentElement.lang = i18n.language;

export default i18n;