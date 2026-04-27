import type { HeatmapDataPoint } from '../../lib/analytics';

interface HeatmapChartProps {
  data: HeatmapDataPoint[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return '12a';
  if (i === 12) return '12p';
  return i < 12 ? `${i}a` : `${i - 12}p`;
});

function getColor(count: number, max: number): string {
  if (max === 0 || count === 0) return '#f1f5f9';
  const intensity = count / max;
  if (intensity < 0.2) return '#dbeafe';
  if (intensity < 0.4) return '#93c5fd';
  if (intensity < 0.6) return '#3b82f6';
  if (intensity < 0.8) return '#1d4ed8';
  return '#1e3a8a';
}

export function HeatmapChart({ data }: HeatmapChartProps) {
  const max = Math.max(...data.map((d) => d.count), 1);

  // Build lookup: data[day][hour] = count
  const grid: Record<number, Record<number, number>> = {};
  data.forEach(({ day, hour, count }) => {
    if (!grid[day]) grid[day] = {};
    grid[day][hour] = count;
  });

  const totalSubmissions = data.reduce((sum, d) => sum + d.count, 0);

  // Peak hour/day
  const peak = data.reduce((best, d) => (d.count > best.count ? d : best), data[0]);
  const peakDay = peak ? DAYS[peak.day] : '—';
  const peakHour = peak ? HOURS[peak.hour] : '—';

  return (
    <div className="bg-color-surface rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-xl font-semibold text-color-primary">Submission Heatmap</h2>
          <p className="text-xs text-color-muted-text mt-1">
            When do submissions arrive? Darker = more volume.
          </p>
        </div>
        {totalSubmissions > 0 && (
          <div className="text-right text-xs text-color-muted-text">
            <div>Peak day: <span className="font-semibold text-color-primary">{peakDay}</span></div>
            <div>Peak hour: <span className="font-semibold text-color-primary">{peakHour}</span></div>
          </div>
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour labels */}
          <div className="flex mb-1 ml-10">
            {HOURS.map((h, i) => (
              <div
                key={i}
                className="flex-1 text-center text-color-muted-text"
                style={{ fontSize: '9px' }}
              >
                {i % 3 === 0 ? h : ''}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {DAYS.map((day, dayIdx) => (
            <div key={dayIdx} className="flex items-center mb-0.5">
              <span
                className="w-10 text-right pr-2 text-color-muted-text flex-shrink-0"
                style={{ fontSize: '11px' }}
              >
                {day}
              </span>
              {Array.from({ length: 24 }, (_, hour) => {
                const count = grid[dayIdx]?.[hour] ?? 0;
                const color = getColor(count, max);
                return (
                  <div
                    key={hour}
                    className="flex-1 rounded-sm mx-px cursor-default group relative"
                    style={{ backgroundColor: color, height: '22px' }}
                    title={`${day} ${HOURS[hour]}: ${count} submissions`}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 whitespace-nowrap bg-gray-800 text-white text-xs rounded px-2 py-1 pointer-events-none">
                      {day} {HOURS[hour]}: {count}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 justify-end">
            <span className="text-xs text-color-muted-text">Low</span>
            {['#f1f5f9', '#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8', '#1e3a8a'].map((c) => (
              <div
                key={c}
                className="w-5 h-4 rounded-sm"
                style={{ backgroundColor: c, border: '1px solid #e5e7eb' }}
              />
            ))}
            <span className="text-xs text-color-muted-text">High</span>
          </div>
        </div>
      </div>
    </div>
  );
}
