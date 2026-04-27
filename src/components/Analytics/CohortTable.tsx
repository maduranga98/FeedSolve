import type { CohortRow } from '../../lib/analytics';

interface CohortTableProps {
  data: CohortRow[];
}

function cellColor(pct: number): string {
  if (pct < 0) return '';
  if (pct >= 80) return 'bg-green-100 text-green-800';
  if (pct >= 60) return 'bg-blue-100 text-blue-800';
  if (pct >= 40) return 'bg-yellow-100 text-yellow-800';
  if (pct >= 20) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
}

export function CohortTable({ data }: CohortTableProps) {
  const maxPeriods = Math.max(...data.map((r) => r.resolvedByPeriod.length), 1);

  return (
    <div className="bg-color-surface rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-color-primary mb-2">Cohort Analysis</h2>
      <p className="text-xs text-color-muted-text mb-6">
        % of submissions resolved by the end of each week after they arrived. Darker green = faster resolution.
      </p>

      {data.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-color-muted-text">
          Not enough data yet — needs at least 2 weeks of submissions
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-color-border">
                <th className="text-left py-2 px-3 font-semibold text-color-body-text whitespace-nowrap">
                  Cohort
                </th>
                <th className="text-right py-2 px-3 font-semibold text-color-body-text">Total</th>
                {Array.from({ length: maxPeriods }, (_, i) => (
                  <th key={i} className="text-center py-2 px-3 font-semibold text-color-body-text whitespace-nowrap">
                    Week {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.cohortStart} className="border-b border-color-border hover:bg-color-bg">
                  <td className="py-2 px-3 text-color-body-text whitespace-nowrap text-xs">
                    {row.cohortLabel}
                  </td>
                  <td className="py-2 px-3 text-right text-color-body-text font-medium">
                    {row.total}
                  </td>
                  {row.resolvedByPeriod.map((pct, i) => (
                    <td key={i} className="py-2 px-1 text-center">
                      {pct < 0 ? (
                        <span className="text-color-muted-text text-xs">—</span>
                      ) : (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cellColor(pct)}`}
                        >
                          {pct}%
                        </span>
                      )}
                    </td>
                  ))}
                  {/* Pad missing periods */}
                  {Array.from({ length: maxPeriods - row.resolvedByPeriod.length }, (_, i) => (
                    <td key={`pad-${i}`} className="py-2 px-1 text-center">
                      <span className="text-color-muted-text text-xs">—</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-2 mt-4">
        <span className="text-xs text-color-muted-text">% resolved by week:</span>
        {[
          { label: '≥80%', cls: 'bg-green-100 text-green-800' },
          { label: '≥60%', cls: 'bg-blue-100 text-blue-800' },
          { label: '≥40%', cls: 'bg-yellow-100 text-yellow-800' },
          { label: '≥20%', cls: 'bg-orange-100 text-orange-800' },
          { label: '<20%', cls: 'bg-red-100 text-red-800' },
        ].map((l) => (
          <span key={l.label} className={`text-xs px-2 py-0.5 rounded font-medium ${l.cls}`}>
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
