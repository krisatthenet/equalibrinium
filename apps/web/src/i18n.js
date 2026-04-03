import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import ltTranslations from './locales/lt.json';
import ruTranslations from './locales/ru.json';
import plTranslations from './locales/pl.json';
import trTranslations from './locales/tr.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: enTranslations,
      lt: ltTranslations,
      ru: ruTranslations,
      pl: plTranslations,
      tr: trTranslations
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

export default i18n;