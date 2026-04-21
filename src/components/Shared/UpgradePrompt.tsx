import { Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHasFeature } from '../../hooks/useHasFeature';

interface UpgradePromptProps {
  feature: string;
  minTier?: 'starter' | 'growth' | 'business';
}

export function UpgradePrompt({ feature, minTier = 'growth' }: UpgradePromptProps) {
  const navigate = useNavigate();
  const { getCurrentTier } = useHasFeature();
  const currentTier = getCurrentTier();

  if (currentTier === minTier || (minTier === 'growth' && currentTier === 'business')) {
    return null;
  }

  return (
    <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 flex gap-3 items-start">
      <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-blue-900 font-medium">
          {feature} is a {minTier} feature
        </p>
        <p className="text-blue-800 text-sm">
          Upgrade your plan to unlock {feature}
        </p>
      </div>
      <button
        onClick={() => navigate('/pricing')}
        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm whitespace-nowrap"
      >
        Upgrade
      </button>
    </div>
  );
}
