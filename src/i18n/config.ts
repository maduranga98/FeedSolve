import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { SUPPORTED_LANGUAGE_CODES, DEFAULT_LANGUAGE } from '../config/languages';

// English
import en_common from '../locales/en/common.json';
import en_forms from '../locales/en/forms.json';
import en_boards from '../locales/en/boards.json';
import en_errors from '../locales/en/errors.json';
import en_templates from '../locales/en/templates.json';

// Spanish
import es_common from '../locales/es/common.json';
import es_forms from '../locales/es/forms.json';
import es_boards from '../locales/es/boards.json';
import es_errors from '../locales/es/errors.json';
import es_templates from '../locales/es/templates.json';

// Arabic
import ar_common from '../locales/ar/common.json';
import ar_forms from '../locales/ar/forms.json';
import ar_boards from '../locales/ar/boards.json';
import ar_errors from '../locales/ar/errors.json';
import ar_templates from '../locales/ar/templates.json';

// Portuguese (Brazil)
import pt_common from '../locales/pt/common.json';
import pt_forms from '../locales/pt/forms.json';
import pt_boards from '../locales/pt/boards.json';
import pt_errors from '../locales/pt/errors.json';
import pt_templates from '../locales/pt/templates.json';

const resources = {
  en: {
    common: en_common,
    forms: en_forms,
    boards: en_boards,
    errors: en_errors,
    templates: en_templates,
  },
  es: {
    common: es_common,
    forms: es_forms,
    boards: es_boards,
    errors: es_errors,
    templates: es_templates,
  },
  ar: {
    common: ar_common,
    forms: ar_forms,
    boards: ar_boards,
    errors: ar_errors,
    templates: ar_templates,
  },
  pt: {
    common: pt_common,
    forms: pt_forms,
    boards: pt_boards,
    errors: pt_errors,
    templates: pt_templates,
  },
};

const detectLanguage = (): string => {
  const saved = localStorage.getItem('feedsolve_language');
  if (saved && SUPPORTED_LANGUAGE_CODES.includes(saved)) {
    return saved;
  }

  const browserLang = navigator.language.split('-')[0];
  if (SUPPORTED_LANGUAGE_CODES.includes(browserLang)) {
    return browserLang;
  }

  return DEFAULT_LANGUAGE;
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
