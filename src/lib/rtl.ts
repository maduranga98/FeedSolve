import { getLanguage } from '../config/languages';

export const isRTL = (lang: string): boolean => {
  const base = lang.split('-')[0].toLowerCase();
  return getLanguage(base)?.dir === 'rtl';
};

export const getTextDirection = (lang: string): 'ltr' | 'rtl' =>
  isRTL(lang) ? 'rtl' : 'ltr';

export const applyTextDirection = (lang: string): void => {
  const direction = getTextDirection(lang);
  document.documentElement.setAttribute('dir', direction);
  document.documentElement.setAttribute('lang', lang);
};

export const getRtlMargin = (lang: string) => {
  if (!isRTL(lang)) return {};
  return {
    marginRight: 'auto',
    marginLeft: 0,
  };
};

export const getRtlPadding = (lang: string) => {
  if (!isRTL(lang)) return {};
  return {
    paddingRight: 'inherit',
    paddingLeft: 'inherit',
  };
};
