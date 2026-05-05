import { useSubscription } from './useSubscription';
import { hasFeature, getLimit } from '../lib/tier-limits';

export function useHasFeature() {
  const { subscription } = useSubscription();

  const checkFeature = (feature: 'canReply' | 'canViewAnalytics' | 'canRemoveBranding' | 'canAccessAPI' | 'canUseTemplates'): boolean => {
    if (!subscription) return false;
    return hasFeature(subscription.tier, feature);
  };

  const getFeatureLimit = (feature: 'boards' | 'submissions' | 'teamMembers'): number => {
    if (!subscription) return 0;
    return getLimit(subscription.tier, feature);
  };

  const getCurrentTier = () => subscription?.tier || 'free';

  return {
    checkFeature,
    getFeatureLimit,
    getCurrentTier,
    tier: subscription?.tier,
  };
}
