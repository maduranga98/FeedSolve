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
} from 'recharts';
import { AlertTriangle } from 'lucide-react';
import type { AnomalyDataPoint } from '../../lib/analytics';

interface AnomalyChartProps {
  data: AnomalyDataPoint[];
}

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload.isAnomaly) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill="#ef4444"
      stroke="#fff"
      strokeWidth={2}
    />
  );
};

export function AnomalyChart({ data }: AnomalyChartProps) {
  const anomalyCount = data.filter((d) => d.isAnomaly).length;

  return (
    <div className="bg-color-surface rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold text-color-primary">Anomaly Detection</h2>
        {anomalyCount > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 rounded-full border border-red-200">
            <AlertTriangle size={14} className="text-red-500" />
            <span className="text-xs font-medium text-red-600">
              {anomalyCount} anomal{anomalyCount === 1 ? 'y' : 'ies'} detected
            </span>
          </div>
        )}
      </div>
      <p className="text-xs text-color-muted-text mb-6">
        Red dots mark days where submission volume deviated significantly from the rolling 7-day average.
      </p>

      {data.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-color-muted-text">
          Not enough data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              style={{ fontSize: '11px' }}
              tick={{ fill: '#6b7280' }}
              tickFormatter={(v) => v.slice(5)} // Show MM-DD
            />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} tick={{ fill: '#6b7280' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              formatter={(value: any, name: any) => {
                if (name === 'count') return [value, 'Actual'];
                if (name === 'rollingAvg') return [value, '7-day avg'];
                return [value, name];
              }}
            />
            <Legend
              formatter={(value) => {
                if (value === 'count') return 'Actual submissions';
                if (value === 'rollingAvg') return '7-day rolling avg';
                if (value === 'isAnomaly') return 'Anomaly';
                return value;
              }}
            />
            {/* Rolling average band */}
            <Area
              type="monotone"
              dataKey="rollingAvg"
              stroke="#94a3b8"
              fill="#e2e8f0"
              fillOpacity={0.4}
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
            />
            {/* Actual count */}
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
