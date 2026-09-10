import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { MapPin } from 'lucide-react';
import type { Submission } from '../../types';

interface LocationComparisonChartProps {
  submissions: Submission[];
  maxLocations?: number;
}

type Metric = 'total' | 'status' | 'satisfaction';

interface RowBase {
  location: string;
  total: number;
}

function getCreatedAt(submission: Submission): Date | null {
  if (!submission.createdAt) return null;
  if (submission.createdAt instanceof Date) return submission.createdAt;
  return submission.createdAt.toDate();
}

const STATUS_COLORS: Record<string, string> = {
  new: '#3B82F6',
  in_progress: '#F59E0B',
  resolved: '#10B981',
  closed: '#6B7280',
};

const SATISFACTION_COLORS: Record<string, string> = {
  positive: '#10B981',
  neutral: '#F59E0B',
  negative: '#EF4444',
};

export function LocationComparisonChart({ submissions, maxLocations = 8 }: LocationComparisonChartProps) {
  const [metric, setMetric] = useState<Metric>('status');

  const { data, statusKeys, satisfactionKeys } = useMemo(() => {
    const byLocation = new Map<string, {
      total: number;
      statuses: Record<string, number>;
      satisfaction: Record<string, number>;
    }>();

    for (const submission of submissions) {
      if (!submission.location) continue;
      if (!getCreatedAt(submission)) continue;
      const loc = submission.location;
      const entry = byLocation.get(loc) || {
        total: 0,
        statuses: {} as Record<string, number>,
        satisfaction: {} as Record<string, number>,
      };
      entry.total += 1;

      const status = (submission.status || 'new') as string;
      entry.statuses[status] = (entry.statuses[status] || 0) + 1;

      const score = typeof submission.satisfactionScore === 'number' ? submission.satisfactionScore : null;
      if (score !== null) {
        const bucket = score >= 4 ? 'positive' : score === 3 ? 'neutral' : 'negative';
        entry.satisfaction[bucket] = (entry.satisfaction[bucket] || 0) + 1;
      }

      byLocation.set(loc, entry);
    }

    const sorted = Array.from(byLocation.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, maxLocations);

    const statusSet = new Set<string>();
    const satisfactionSet = new Set<string>();
    sorted.forEach(([, v]) => {
      Object.keys(v.statuses).forEach((k) => statusSet.add(k));
      Object.keys(v.satisfaction).forEach((k) => satisfactionSet.add(k));
    });

    const rows = sorted.map(([location, v]) => {
      const row: RowBase & Record<string, number | string> = { location, total: v.total };
      statusSet.forEach((k) => {
        row[`status_${k}`] = v.statuses[k] || 0;
      });
      satisfactionSet.forEach((k) => {
        row[`sat_${k}`] = v.satisfaction[k] || 0;
      });
      return row;
    });

    return {
      data: rows,
      statusKeys: Array.from(statusSet),
      satisfactionKeys: Array.from(satisfactionSet),
    };
  }, [submissions, maxLocations]);

  return (
    <div className="bg-[var(--c-sffffff)] rounded-xl border border-[var(--c-be8ecf0)] p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[var(--c-sebf5fb)] rounded-xl flex items-center justify-center flex-shrink-0">
            <MapPin size={18} className="text-[var(--c-t2e86ab)]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--c-t1e3a5f)]">Compare Locations</h2>
            <p className="text-sm text-[var(--c-t6b7b8d)]">
              See how submissions stack up across your top locations.
            </p>
          </div>
        </div>

        <div className="inline-flex rounded-lg border border-[var(--c-bd5dde5)] bg-[var(--c-sffffff)] p-0.5 text-xs font-semibold">
          {([
            { key: 'total', label: 'Volume' },
            { key: 'status', label: 'By status' },
            { key: 'satisfaction', label: 'By rating' },
          ] as Array<{ key: Metric; label: string }>).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setMetric(opt.key)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                metric === opt.key
                  ? 'bg-[var(--c-s2e86ab)] text-white'
                  : 'bg-[var(--c-sf1f5f8)] text-[var(--c-t1e3a5f)] hover:bg-[var(--c-s2e86ab)] hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-sm text-[var(--c-t9aabbf)]">
          No location-tagged submissions yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF3F7" />
            <XAxis
              dataKey="location"
              tick={{ fill: '#6B7B8D', fontSize: 12 }}
              interval={0}
              angle={data.length > 4 ? -20 : 0}
              textAnchor={data.length > 4 ? 'end' : 'middle'}
              height={data.length > 4 ? 60 : 30}
            />
            <YAxis tick={{ fill: '#6B7B8D', fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #E3EDF4',
                borderRadius: 10,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {metric === 'total' && (
              <Bar dataKey="total" name="Submissions" fill="#2E86AB" radius={[6, 6, 0, 0]} />
            )}
            {metric === 'status' &&
              statusKeys.map((key) => (
                <Bar
                  key={key}
                  dataKey={`status_${key}`}
                  name={key.replace(/_/g, ' ')}
                  stackId="status"
                  fill={STATUS_COLORS[key] || '#94A3B8'}
                  radius={[0, 0, 0, 0]}
                />
              ))}
            {metric === 'satisfaction' &&
              satisfactionKeys.map((key) => (
                <Bar
                  key={key}
                  dataKey={`sat_${key}`}
                  name={key}
                  stackId="sat"
                  fill={SATISFACTION_COLORS[key] || '#94A3B8'}
                  radius={[0, 0, 0, 0]}
                />
              ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
