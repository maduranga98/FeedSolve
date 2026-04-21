import { useState } from 'react';
import { Download } from 'lucide-react';

interface ReportBuilderProps {
  onGenerateReport: (options: ReportOptions) => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
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

  return (
    <div className="bg-color-surface rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-color-primary mb-6">Report Builder</h2>

      <div className="space-y-4 mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.includeMetrics}
            onChange={() => handleCheckboxChange('includeMetrics')}
            className="w-4 h-4"
          />
          <span className="text-color-body-text">Key Metrics (resolution rate, avg time)</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.includeStatus}
            onChange={() => handleCheckboxChange('includeStatus')}
            className="w-4 h-4"
          />
          <span className="text-color-body-text">Submissions by Status</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.includePriority}
            onChange={() => handleCheckboxChange('includePriority')}
            className="w-4 h-4"
          />
          <span className="text-color-body-text">Submissions by Priority</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.includeCategory}
            onChange={() => handleCheckboxChange('includeCategory')}
            className="w-4 h-4"
          />
          <span className="text-color-body-text">Submissions by Category</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.includeTeamPerformance}
            onChange={() => handleCheckboxChange('includeTeamPerformance')}
            className="w-4 h-4"
          />
          <span className="text-color-body-text">Team Performance</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.includeTrends}
            onChange={() => handleCheckboxChange('includeTrends')}
            className="w-4 h-4"
          />
          <span className="text-color-body-text">Trend Analysis</span>
        </label>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleGenerateReport}
          disabled={loading}
          className="w-full px-4 py-2 bg-color-primary text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Download size={18} />
          Generate Custom Report
        </button>

        <button
          onClick={onExportPDF}
          disabled={loading}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Download size={18} />
          Export as PDF
        </button>

        <button
          onClick={onExportCSV}
          disabled={loading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Download size={18} />
          Export Submissions as CSV
        </button>
      </div>

      <p className="text-xs text-color-muted-text mt-4">
        Tip: Use the date range selector above to filter data before exporting.
      </p>
    </div>
  );
}
