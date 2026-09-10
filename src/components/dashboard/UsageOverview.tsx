import { AlertTriangle, TrendingUp, ArrowUpRight } from 'lucide-react';
import { UsageBar } from '../Shared/UsageBar';
import { useUsage } from '../../hooks/useUsage';
import { useSubscription } from '../../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  free:     { label: 'Trial',    color: 'bg-[var(--c-sf0f4f8)] text-[var(--c-t4a6274)]' },
  starter:  { label: 'Starter',  color: 'bg-[var(--c-sebf5fb)] text-[var(--c-t2e86ab)]' },
  growth:   { label: 'Growth',   color: 'bg-[var(--c-se8f8f0)] text-[var(--c-t1e8449)]' },
  business: { label: 'Pro',      color: 'bg-[var(--c-sf4ecf7)] text-[var(--c-t7d3c98)]' },
};

export function UsageOverview() {
  const { submissions, boards, teamMembers } = useUsage();
  const { subscription } = useSubscription();
  const navigate = useNavigate();

  if (!subscription) return null;

  const features = [
    { label: 'Submissions This Month', ...submissions },
    { label: 'Feedback Boards',        ...boards },
    { label: 'Team Members',           ...teamMembers },
  ];

  const hasWarning = features.some((f) => f.nearLimit || f.atLimit);
  const tierInfo = TIER_LABELS[subscription.tier] || TIER_LABELS.free;

  return (
    <div className="bg-[var(--c-sffffff)] border border-[var(--c-be8ecf0)] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-[var(--c-t2e86ab)]" />
          <h3 className="text-sm font-semibold text-[var(--c-t1e3a5f)]">Usage Overview</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${tierInfo.color}`}>
            {tierInfo.label}
          </span>
          {subscription.tier === 'free' && (
            <button
              onClick={() => navigate('/pricing')}
              className="inline-flex items-center gap-1 text-xs text-[var(--c-t2e86ab)] font-medium hover:underline"
            >
              Upgrade <ArrowUpRight size={11} />
            </button>
          )}
        </div>
      </div>

      {hasWarning && (
        <div className="mb-4 px-3 py-2.5 bg-[var(--c-sfef9e7)] border border-[var(--c-bf9ca6a)]/40 rounded-lg flex items-start gap-2.5">
          <AlertTriangle size={14} className="text-[var(--c-td4a017)] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--c-t7d5a00)] leading-relaxed">
            You're approaching your usage limits.{' '}
            <button onClick={() => navigate('/pricing')} className="underline font-medium">Upgrade your plan</button>
            {' '}to avoid interruptions.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {features.map((feature) => (
          <UsageBar
            key={feature.label}
            current={feature.current}
            limit={feature.limit}
            label={feature.label}
          />
        ))}
      </div>
    </div>
  );
}
