import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar } from 'lucide-react';
import type { DateRange } from '../../lib/date-ranges';
import { getDateRangePreset, getPresetLabel, type DateRangePreset } from '../../lib/date-ranges';
import type { TrendDataPoint } from '../../lib/analytics';

interface TrendChartProps {
  data: TrendDataPoint[];
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  loading?: boolean;
}

const presets: DateRangePreset[] = ['7days', '30days', '90days'];

export function TrendChart({
  data,
  dateRange,
  onDateRangeChange,
  loading = false,
}: TrendChartProps) {
  const { t } = useTranslation();
  const [isCustom, setIsCustom] = useState(dateRange.preset === 'custom');
  const [customFrom, setCustomFrom] = useState(
    dateRange.from.toISOString().split('T')[0]
  );
  const [customTo, setCustomTo] = useState(
    dateRange.to.toISOString().split('T')[0]
  );

  const handlePresetChange = (preset: DateRangePreset) => {
    setIsCustom(false);
    onDateRangeChange(getDateRangePreset(preset));
  };

  const handleCustomApply = () => {
    const from = new Date(customFrom);
    const to = new Date(customTo);
    if (from <= to) {
      onDateRangeChange({
        from: new Date(from.setHours(0, 0, 0, 0)),
        to: new Date(to.setHours(23, 59, 59, 999)),
        preset: 'custom',
      });
    }
  };

  return (
    <div className="bg-color-surface rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-color-primary">{t('analytics.submissions_trend')}</h2>

        <div className="flex items-center gap-2">
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetChange(preset)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                dateRange.preset === preset
                  ? 'bg-[var(--c-s1e3a5f)] text-white'
                  : 'bg-[var(--c-sebf5fb)] text-[var(--c-t1e3a5f)] border border-[var(--c-bc8dde8)] hover:bg-[var(--c-s2e86ab)] hover:text-white hover:border-[var(--c-b2e86ab)]'
              }`}
            >
              {getPresetLabel(preset as DateRangePreset)}
            </button>
          ))}

          <button
            onClick={() => setIsCustom(!isCustom)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
              isCustom
                ? 'bg-[var(--c-s1e3a5f)] text-white'
                : 'bg-[var(--c-sebf5fb)] text-[var(--c-t1e3a5f)] border border-[var(--c-bc8dde8)] hover:bg-[var(--c-s2e86ab)] hover:text-white hover:border-[var(--c-b2e86ab)]'
            }`}
          >
            <Calendar size={16} />
            {t('analytics.custom')}
          </button>
        </div>
      </div>

      {isCustom && (
        <div className="mb-6 p-4 bg-color-bg rounded border border-color-border flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-color-body-text mb-1">
              {t('analytics.from')}
            </label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="w-full min-w-0 px-3 py-2 border border-color-border rounded bg-color-surface text-color-body-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-color-body-text mb-1">
              {t('analytics.to')}
            </label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="w-full min-w-0 px-3 py-2 border border-color-border rounded bg-color-surface text-color-body-text"
            />
          </div>
          <button
            onClick={handleCustomApply}
            className="px-4 py-2 bg-[var(--c-s1e3a5f)] text-white rounded font-medium hover:bg-[var(--c-s2e86ab)] transition-colors"
          >
            {t('analytics.apply')}
          </button>
        </div>
      )}

      {loading ? (
        <div className="h-80 flex items-center justify-center text-color-muted-text">
          {t('analytics.loading_chart')}
        </div>
      ) : data.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-color-muted-text">
          {t('analytics.no_data_range')}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} tick={{ fill: '#6b7280' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              name={t('analytics.total_submissions_line')}
              strokeWidth={2}
              dot={{ fill: '#3b82f6' }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="resolved"
              stroke="#10b981"
              name={t('analytics.resolved_line')}
              strokeWidth={2}
              dot={{ fill: '#10b981' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
