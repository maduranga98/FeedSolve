import { AlertTriangle, TrendingUp, ArrowUpRight } from 'lucide-react';
import { UsageBar } from '../Shared/UsageBar';
import { useUsage } from '../../hooks/useUsage';
import { useSubscription } from '../../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  free:     { label: 'Free',     color: 'bg-[#F0F4F8] text-[#4A6274]' },
  starter:  { label: 'Starter',  color: 'bg-[#EBF5FB] text-[#2E86AB]' },
  growth:   { label: 'Growth',   color: 'bg-[#E8F8F0] text-[#1E8449]' },
  business: { label: 'Business', color: 'bg-[#F4ECF7] text-[#7D3C98]' },
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
    <div className="bg-white border border-[#E8ECF0] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-[#2E86AB]" />
          <h3 className="text-sm font-semibold text-[#1E3A5F]">Usage Overview</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${tierInfo.color}`}>
            {tierInfo.label}
          </span>
          {subscription.tier === 'free' && (
            <button
              onClick={() => navigate('/pricing')}
              className="inline-flex items-center gap-1 text-xs text-[#2E86AB] font-medium hover:underline"
            >
              Upgrade <ArrowUpRight size={11} />
            </button>
          )}
        </div>
      </div>

      {hasWarning && (
        <div className="mb-4 px-3 py-2.5 bg-[#FEF9E7] border border-[#F9CA6A]/40 rounded-lg flex items-start gap-2.5">
          <AlertTriangle size={14} className="text-[#D4A017] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#7D5A00] leading-relaxed">
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
