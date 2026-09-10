import { Star } from 'lucide-react';
import type { SatisfactionMetrics } from '../../lib/analytics';

interface SatisfactionAnalysisCardProps {
  metrics: SatisfactionMetrics;
}

const SCORE_LABELS: Record<number, string> = {
  1: 'Very Unsatisfied',
  2: 'Unsatisfied',
  3: 'Neutral',
  4: 'Satisfied',
  5: 'Very Satisfied',
};

const SCORE_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#22c55e',
  5: '#10b981',
};

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={star <= Math.round(score) ? 'text-[var(--c-tf59e0b)]' : 'text-[var(--c-td5dde5)]'}
          fill={star <= Math.round(score) ? '#F59E0B' : 'none'}
        />
      ))}
    </div>
  );
}

export function SatisfactionAnalysisCard({ metrics }: SatisfactionAnalysisCardProps) {
  const maxCount = Math.max(1, ...Object.values(metrics.scoreDistribution));

  const satisfactionColor =
    metrics.averageScore >= 4
      ? '#10b981'
      : metrics.averageScore >= 3
        ? '#eab308'
        : '#ef4444';

  return (
    <div className="rounded-xl border border-[var(--c-be8ecf0)] bg-[var(--c-sffffff)] p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--c-t1e3a5f)]">Satisfaction Analysis</h2>
          <p className="text-sm text-[var(--c-t6b7b8d)]">Customer satisfaction ratings from resolved submissions</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--c-sfff8e6)]">
          <Star size={18} className="text-[var(--c-tf59e0b)]" fill="#F59E0B" />
        </div>
      </div>

      {metrics.totalRatings === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Star size={32} className="mb-3 text-[var(--c-td5dde5)]" />
          <p className="font-medium text-[var(--c-t1e3a5f)]">No ratings yet</p>
          <p className="mt-1 text-sm text-[var(--c-t6b7b8d)]">
            Enable satisfaction ratings on your boards to collect feedback scores.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Summary */}
          <div className="space-y-4">
            <div className="rounded-xl bg-[var(--c-sf8fafb)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-t6b7b8d)]">
                Average Score
              </p>
              <div className="mt-2 flex items-end gap-2">
                <span
                  className="text-4xl font-bold"
                  style={{ color: satisfactionColor }}
                >
                  {metrics.averageScore}
                </span>
                <span className="mb-1 text-sm text-[var(--c-t6b7b8d)]">/ 5</span>
              </div>
              <div className="mt-2">
                <StarRating score={metrics.averageScore} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[var(--c-sf8fafb)] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-t6b7b8d)]">
                  Total Ratings
                </p>
                <p className="mt-1 text-2xl font-bold text-[var(--c-t1e3a5f)]">
                  {metrics.totalRatings}
                </p>
              </div>
              <div className="rounded-xl bg-[var(--c-sf8fafb)] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-t6b7b8d)]">
                  Satisfied
                </p>
                <p className="mt-1 text-2xl font-bold text-[var(--c-t10b981)]">
                  {metrics.satisfactionRate}%
                </p>
                <p className="text-xs text-[var(--c-t6b7b8d)]">4-5 star ratings</p>
              </div>
            </div>
          </div>

          {/* Score Distribution */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-t6b7b8d)]">
              Score Distribution
            </p>
            {[5, 4, 3, 2, 1].map((score) => {
              const count = metrics.scoreDistribution[score] || 0;
              const pct = metrics.totalRatings > 0 ? (count / metrics.totalRatings) * 100 : 0;
              const barWidth = metrics.totalRatings > 0 ? (count / maxCount) * 100 : 0;
              return (
                <div key={score} className="flex items-center gap-2">
                  <div className="flex w-24 flex-shrink-0 items-center gap-1">
                    <span className="w-3 text-right text-xs font-semibold text-[var(--c-t1e3a5f)]">
                      {score}
                    </span>
                    <Star
                      size={11}
                      className="text-[var(--c-tf59e0b)]"
                      fill="#F59E0B"
                    />
                    <span className="text-xs text-[var(--c-t6b7b8d)]">
                      {SCORE_LABELS[score].split(' ')[score >= 4 ? 1 : 0]}
                    </span>
                  </div>
                  <div className="flex flex-1 items-center gap-2">
                    <div className="flex-1 overflow-hidden rounded-full bg-[var(--c-sf1f5f8)]" style={{ height: 8 }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: SCORE_COLORS[score],
                        }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs font-medium text-[var(--c-t6b7b8d)]">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
