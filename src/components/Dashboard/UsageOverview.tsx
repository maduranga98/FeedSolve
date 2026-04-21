import { AlertCircle } from 'lucide-react';
import { UsageBar } from '../Shared/UsageBar';
import { useUsage } from '../../hooks/useUsage';
import { useSubscription } from '../../hooks/useSubscription';

export function UsageOverview() {
  const { submissions, boards, teamMembers } = useUsage();
  const { subscription } = useSubscription();

  if (!subscription) return null;

  const features = [
    {
      label: 'Submissions This Month',
      ...submissions,
      color: 'blue',
    },
    {
      label: 'Feedback Boards',
      ...boards,
      color: 'green',
    },
    {
      label: 'Team Members',
      ...teamMembers,
      color: 'purple',
    },
  ];

  const hasWarning = features.some((f) => f.nearLimit || f.atLimit);

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Usage Overview</h3>
        {subscription.tier === 'free' && (
          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">
            Free Plan
          </span>
        )}
      </div>

      {hasWarning && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-800 text-sm">
            You're approaching or have reached your usage limits. Consider upgrading your plan.
          </p>
        </div>
      )}

      <div className="space-y-6">
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
