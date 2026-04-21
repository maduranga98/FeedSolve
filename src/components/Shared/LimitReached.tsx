import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LimitReachedProps {
  feature: string;
  limit: number;
  tier: string;
}

const upgradeSuggestions: Record<string, string> = {
  free: 'starter',
  starter: 'growth',
  growth: 'business',
};

export function LimitReached({ feature, limit, tier }: LimitReachedProps) {
  const navigate = useNavigate();
  const suggestedTier = upgradeSuggestions[tier];

  return (
    <div className="rounded-lg border-2 border-red-300 bg-red-50 p-6 mb-6">
      <div className="flex gap-4">
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-red-900 mb-2">
            {feature} limit reached ({limit} maximum)
          </h3>
          <p className="text-red-800 mb-4">
            You've hit the {feature} limit for your {tier} plan. Upgrade to continue.
          </p>
          <button
            onClick={() => navigate('/pricing')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium text-sm"
          >
            Upgrade to {suggestedTier ? suggestedTier.charAt(0).toUpperCase() + suggestedTier.slice(1) : 'Higher'} Plan
          </button>
        </div>
      </div>
    </div>
  );
}
