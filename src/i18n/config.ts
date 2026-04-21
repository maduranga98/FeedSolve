import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// English
import en_common from '../locales/en/common.json';
import en_forms from '../locales/en/forms.json';
import en_boards from '../locales/en/boards.json';
import en_errors from '../locales/en/errors.json';
import en_templates from '../locales/en/templates.json';

// Sinhala
import si_common from '../locales/si/common.json';
import si_forms from '../locales/si/forms.json';
import si_boards from '../locales/si/boards.json';
import si_errors from '../locales/si/errors.json';
import si_templates from '../locales/si/templates.json';

// Tamil
import ta_common from '../locales/ta/common.json';
import ta_forms from '../locales/ta/forms.json';
import ta_boards from '../locales/ta/boards.json';
import ta_errors from '../locales/ta/errors.json';
import ta_templates from '../locales/ta/templates.json';

// Arabic
import ar_common from '../locales/ar/common.json';
import ar_forms from '../locales/ar/forms.json';
import ar_boards from '../locales/ar/boards.json';
import ar_errors from '../locales/ar/errors.json';
import ar_templates from '../locales/ar/templates.json';

// Hindi
import hi_common from '../locales/hi/common.json';
import hi_forms from '../locales/hi/forms.json';
import hi_boards from '../locales/hi/boards.json';
import hi_errors from '../locales/hi/errors.json';
import hi_templates from '../locales/hi/templates.json';

const resources = {
  en: {
    common: en_common,
    forms: en_forms,
    boards: en_boards,
    errors: en_errors,
    templates: en_templates,
  },
  si: {
    common: si_common,
    forms: si_forms,
    boards: si_boards,
    errors: si_errors,
    templates: si_templates,
  },
  ta: {
    common: ta_common,
    forms: ta_forms,
    boards: ta_boards,
    errors: ta_errors,
    templates: ta_templates,
  },
  ar: {
    common: ar_common,
    forms: ar_forms,
    boards: ar_boards,
    errors: ar_errors,
    templates: ar_templates,
  },
  hi: {
    common: hi_common,
    forms: hi_forms,
    boards: hi_boards,
    errors: hi_errors,
    templates: hi_templates,
  },
};

const detectLanguage = (): string => {
  const saved = localStorage.getItem('feedsolve_language');
  if (saved && ['en', 'si', 'ta', 'ar', 'hi'].includes(saved)) {
    return saved;
  }

  const browserLang = navigator.language.split('-')[0];
  if (['en', 'si', 'ta', 'ar', 'hi'].includes(browserLang)) {
    return browserLang;
  }

  return 'en';
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    lng: detectLanguage(),
  });

export default i18n;
