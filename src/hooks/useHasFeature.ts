import { useSubscription } from './useSubscription';
import { hasFeature, getLimit, getTemplateLimit } from '../lib/tier-limits';

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

  const getTemplateCap = (): number => {
    if (!subscription) return 0;
    return getTemplateLimit(subscription.tier);
  };

  return {
    checkFeature,
    getFeatureLimit,
    getTemplateCap,
    getCurrentTier,
    tier: subscription?.tier,
  };
}
