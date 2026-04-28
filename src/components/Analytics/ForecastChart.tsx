import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { ForecastDataPoint } from '../../lib/analytics';

interface ForecastChartProps {
  data: ForecastDataPoint[];
}

export function ForecastChart({ data }: ForecastChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-color-surface rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-color-primary mb-4">Volume Forecast</h2>
        <div className="h-60 flex items-center justify-center text-color-muted-text">
          Not enough data to forecast
        </div>
      </div>
    );
  }

  // Find the boundary between actual and forecast
  const splitDate = data.find((d) => d.forecast !== null && d.actual === null)?.date;

  // Projected total over forecast period
  const forecastedDays = data.filter((d) => d.actual === null && d.forecast !== null);
  const projectedTotal = forecastedDays.reduce((sum, d) => sum + (d.forecast ?? 0), 0);

  return (
    <div className="bg-color-surface rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-xl font-semibold text-color-primary">Volume Forecast</h2>
          <p className="text-xs text-color-muted-text mt-1">
            Linear trend projection based on the last 30 days of activity.
          </p>
        </div>
        {forecastedDays.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-200">
            <TrendingUp size={14} className="text-purple-600" />
            <span className="text-xs font-medium text-purple-700">
              ~{projectedTotal} predicted next {forecastedDays.length}d
            </span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={280} className="mt-4">
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            style={{ fontSize: '11px' }}
            tick={{ fill: '#6b7280' }}
            tickFormatter={(v) => v.slice(5)}
          />
          <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} tick={{ fill: '#6b7280' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            formatter={(value: any, name: any) => {
              if (name === 'actual') return [value, 'Actual'];
              if (name === 'forecast') return [value, 'Forecast'];
              return [value, name];
            }}
          />
          <Legend
            formatter={(v) => (v === 'actual' ? 'Actual' : v === 'forecast' ? 'Forecast (projected)' : v)}
          />

          {splitDate && (
            <ReferenceLine
              x={splitDate}
              stroke="#8b5cf6"
              strokeDasharray="4 2"
              label={{ value: 'Today', position: 'insideTopRight', fontSize: 11, fill: '#8b5cf6' }}
            />
          )}

          {/* Forecast area */}
          <Area
            type="monotone"
            dataKey="forecast"
            stroke="#8b5cf6"
            fill="#ede9fe"
            fillOpacity={0.5}
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={false}
            connectNulls={false}
          />

          {/* Actual line */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
