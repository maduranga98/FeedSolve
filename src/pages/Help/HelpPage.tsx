import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle } from 'lucide-react';
import { InstructionsAndGuidance } from '../../components/Help/InstructionsAndGuidance';

export function HelpPage() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t('help.title')} | FeedSolve`;
  }, [t]);

  return (
    <div className="min-h-screen bg-[var(--c-se1e8ef)]">
      {/* Page header */}
      <div className="bg-[var(--c-sffffff)] border-b border-[var(--c-be8ecf0)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--c-sebf5fb)] rounded-xl flex items-center justify-center">
              <HelpCircle size={20} className="text-[var(--c-t2e86ab)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--c-t1e3a5f)]">{t('help.title')}</h1>
              <p className="text-sm text-[var(--c-t6b7b8d)] mt-0.5">
                {t('help.subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <InstructionsAndGuidance />
      </div>
    </div>
  );
}
