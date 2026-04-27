import { getStatusColor } from '../../lib/analytics';
import type { FunnelStage } from '../../lib/analytics';

interface FunnelChartProps {
  data: FunnelStage[];
}

export function FunnelChart({ data }: FunnelChartProps) {
  const maxCount = Math.max(...data.map((s) => s.count), 1);

  return (
    <div className="bg-color-surface rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-color-primary mb-2">Submission Lifecycle Funnel</h2>
      <p className="text-xs text-color-muted-text mb-6">
        Shows how many submissions have passed through each stage (cumulative). Narrow drop-offs reveal bottlenecks.
      </p>

      {data.every((s) => s.count === 0) ? (
        <div className="h-40 flex items-center justify-center text-color-muted-text">
          No data available
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((stage, idx) => {
            const widthPct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
            const color = getStatusColor(stage.status);
            const dropPct =
              idx > 0 && data[idx - 1].count > 0
                ? Math.round(((data[idx - 1].count - stage.count) / data[idx - 1].count) * 100)
                : null;

            return (
              <div key={stage.status}>
                {dropPct !== null && dropPct > 0 && (
                  <div className="flex items-center gap-1 text-xs text-color-muted-text pl-2 mb-1">
                    <span>↓</span>
                    <span className="text-red-500">{dropPct}% drop</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span className="w-24 text-right text-sm text-color-body-text flex-shrink-0">
                    {stage.label}
                  </span>
                  <div className="flex-1 bg-color-bg rounded-full h-8 overflow-hidden">
                    <div
                      className="h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                      style={{ width: `${Math.max(widthPct, 4)}%`, backgroundColor: color }}
                    >
                      <span className="text-white text-xs font-semibold whitespace-nowrap">
                        {stage.count}
                      </span>
                    </div>
                  </div>
                  <div className="w-20 text-right text-xs text-color-muted-text flex-shrink-0">
                    {stage.avgDaysInStage !== null ? `~${stage.avgDaysInStage}d avg` : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
