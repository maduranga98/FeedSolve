import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';

interface ReportBuilderProps {
  onGenerateReport: (options: ReportOptions) => void;
  onExportCSV: () => void;
  onExportPDF: (options?: ReportOptions) => void;
  loading?: boolean;
}

export interface ReportOptions {
  includeMetrics: boolean;
  includeStatus: boolean;
  includePriority: boolean;
  includeCategory: boolean;
  includeTeamPerformance: boolean;
  includeTrends: boolean;
}

export function ReportBuilder({
  onGenerateReport,
  onExportCSV,
  onExportPDF,
  loading = false,
}: ReportBuilderProps) {
  const { t } = useTranslation();
  const [options, setOptions] = useState<ReportOptions>({
    includeMetrics: true,
    includeStatus: true,
    includePriority: true,
    includeCategory: true,
    includeTeamPerformance: true,
    includeTrends: true,
  });

  const handleCheckboxChange = (key: keyof ReportOptions) => {
    setOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleGenerateReport = () => {
    onGenerateReport(options);
  };

  const selectedCount = Object.values(options).filter(Boolean).length;
  const noneSelected = selectedCount === 0;

  return (
    <div className="bg-color-surface rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-color-primary mb-6">{t('analytics.report_builder')}</h2>

      <div className="space-y-4 mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.includeMetrics}
            onChange={() => handleCheckboxChange('includeMetrics')}
            className="w-4 h-4 accent-color-accent"
          />
          <span className="text-color-body-text">{t('analytics.key_metrics')}</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.includeStatus}
            onChange={() => handleCheckboxChange('includeStatus')}
            className="w-4 h-4 accent-color-accent"
          />
          <span className="text-color-body-text">{t('analytics.by_status')}</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.includePriority}
            onChange={() => handleCheckboxChange('includePriority')}
            className="w-4 h-4 accent-color-accent"
          />
          <span className="text-color-body-text">{t('analytics.by_priority')}</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.includeCategory}
            onChange={() => handleCheckboxChange('includeCategory')}
            className="w-4 h-4 accent-color-accent"
          />
          <span className="text-color-body-text">{t('analytics.by_category')}</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.includeTeamPerformance}
            onChange={() => handleCheckboxChange('includeTeamPerformance')}
            className="w-4 h-4 accent-color-accent"
          />
          <span className="text-color-body-text">{t('analytics.team_performance')}</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.includeTrends}
            onChange={() => handleCheckboxChange('includeTrends')}
            className="w-4 h-4 accent-color-accent"
          />
          <span className="text-color-body-text">{t('analytics.trend_analysis')}</span>
        </label>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleGenerateReport}
          disabled={loading || noneSelected}
          className="w-full px-4 py-2 bg-[var(--c-s1e3a5f)] text-white rounded-lg font-medium hover:bg-[var(--c-s2e86ab)] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          <Download size={18} />
          {t('analytics.generate_report', { count: selectedCount, plural: selectedCount === 1 ? '' : 's' })}
        </button>

        <button
          onClick={() => onExportPDF(options)}
          disabled={loading}
          className="w-full px-4 py-2 bg-[var(--c-s2e86ab)] text-white rounded-lg font-medium hover:bg-[var(--c-s1e3a5f)] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          <Download size={18} />
          {t('analytics.export_pdf')}
        </button>

        <button
          onClick={onExportCSV}
          disabled={loading}
          className="w-full px-4 py-2 bg-[var(--c-sebf5fb)] text-[var(--c-t1e3a5f)] border border-[var(--c-bc8dde8)] rounded-lg font-medium hover:bg-[var(--c-s2e86ab)] hover:text-white hover:border-[var(--c-b2e86ab)] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          <Download size={18} />
          {t('analytics.export_submissions_csv')}
        </button>
      </div>

      <p className="text-xs text-color-muted-text mt-4">
        {t('analytics.report_tip')}
      </p>
    </div>
  );
}
