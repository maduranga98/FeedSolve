import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { applyTextDirection } from '../lib/rtl';

export function useRTL() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = i18n.language;
    applyTextDirection(lang);
  }, [i18n.language]);
}
