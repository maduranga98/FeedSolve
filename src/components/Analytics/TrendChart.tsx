import { useState } from 'react';
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
        <h2 className="text-xl font-semibold text-color-primary">Submissions Trend</h2>

        <div className="flex items-center gap-2">
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetChange(preset)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                dateRange.preset === preset
                  ? 'bg-color-primary text-white'
                  : 'bg-color-border text-color-body-text hover:bg-color-accent hover:text-white'
              }`}
            >
              {getPresetLabel(preset as DateRangePreset)}
            </button>
          ))}

          <button
            onClick={() => setIsCustom(!isCustom)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
              isCustom
                ? 'bg-color-primary text-white'
                : 'bg-color-border text-color-body-text hover:bg-color-accent hover:text-white'
            }`}
          >
            <Calendar size={16} />
            Custom
          </button>
        </div>
      </div>

      {isCustom && (
        <div className="mb-6 p-4 bg-color-bg rounded border border-color-border flex items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-color-body-text mb-1">
              From
            </label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-3 py-2 border border-color-border rounded bg-color-surface text-color-body-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-color-body-text mb-1">
              To
            </label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-3 py-2 border border-color-border rounded bg-color-surface text-color-body-text"
            />
          </div>
          <button
            onClick={handleCustomApply}
            className="px-4 py-2 bg-color-primary text-white rounded font-medium hover:opacity-90"
          >
            Apply
          </button>
        </div>
      )}

      {loading ? (
        <div className="h-80 flex items-center justify-center text-color-muted-text">
          Loading chart data...
        </div>
      ) : data.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-color-muted-text">
          No data available for this date range
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
              name="Total Submissions"
              strokeWidth={2}
              dot={{ fill: '#3b82f6' }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="resolved"
              stroke="#10b981"
              name="Resolved"
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
