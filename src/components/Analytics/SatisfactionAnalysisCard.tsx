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
          className={star <= Math.round(score) ? 'text-[#F59E0B]' : 'text-[#D5DDE5]'}
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
    <div className="rounded-xl border border-[#E8ECF0] bg-white p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1E3A5F]">Satisfaction Analysis</h2>
          <p className="text-sm text-[#6B7B8D]">Customer satisfaction ratings from resolved submissions</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF8E6]">
          <Star size={18} className="text-[#F59E0B]" fill="#F59E0B" />
        </div>
      </div>

      {metrics.totalRatings === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Star size={32} className="mb-3 text-[#D5DDE5]" />
          <p className="font-medium text-[#1E3A5F]">No ratings yet</p>
          <p className="mt-1 text-sm text-[#6B7B8D]">
            Enable satisfaction ratings on your boards to collect feedback scores.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Summary */}
          <div className="space-y-4">
            <div className="rounded-xl bg-[#F8FAFB] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7B8D]">
                Average Score
              </p>
              <div className="mt-2 flex items-end gap-2">
                <span
                  className="text-4xl font-bold"
                  style={{ color: satisfactionColor }}
                >
                  {metrics.averageScore}
                </span>
                <span className="mb-1 text-sm text-[#6B7B8D]">/ 5</span>
              </div>
              <div className="mt-2">
                <StarRating score={metrics.averageScore} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#F8FAFB] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7B8D]">
                  Total Ratings
                </p>
                <p className="mt-1 text-2xl font-bold text-[#1E3A5F]">
                  {metrics.totalRatings}
                </p>
              </div>
              <div className="rounded-xl bg-[#F8FAFB] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7B8D]">
                  Satisfied
                </p>
                <p className="mt-1 text-2xl font-bold text-[#10b981]">
                  {metrics.satisfactionRate}%
                </p>
                <p className="text-xs text-[#6B7B8D]">4-5 star ratings</p>
              </div>
            </div>
          </div>

          {/* Score Distribution */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7B8D]">
              Score Distribution
            </p>
            {[5, 4, 3, 2, 1].map((score) => {
              const count = metrics.scoreDistribution[score] || 0;
              const pct = metrics.totalRatings > 0 ? (count / metrics.totalRatings) * 100 : 0;
              const barWidth = metrics.totalRatings > 0 ? (count / maxCount) * 100 : 0;
              return (
                <div key={score} className="flex items-center gap-2">
                  <div className="flex w-24 flex-shrink-0 items-center gap-1">
                    <span className="w-3 text-right text-xs font-semibold text-[#1E3A5F]">
                      {score}
                    </span>
                    <Star
                      size={11}
                      className="text-[#F59E0B]"
                      fill="#F59E0B"
                    />
                    <span className="text-xs text-[#6B7B8D]">
                      {SCORE_LABELS[score].split(' ')[score >= 4 ? 1 : 0]}
                    </span>
                  </div>
                  <div className="flex flex-1 items-center gap-2">
                    <div className="flex-1 overflow-hidden rounded-full bg-[#F1F5F8]" style={{ height: 8 }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: SCORE_COLORS[score],
                        }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs font-medium text-[#6B7B8D]">
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
