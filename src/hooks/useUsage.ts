import { useSubscription } from './useSubscription';
import { getLimit } from '../lib/tier-limits';

export function useUsage() {
  const { subscription, usage } = useSubscription();

  if (!subscription || !usage) {
    return {
      submissions: { current: 0, limit: 0, percentage: 0, nearLimit: false, atLimit: false },
      boards: { current: 0, limit: 0, percentage: 0, nearLimit: false, atLimit: false },
      teamMembers: { current: 0, limit: 0, percentage: 0, nearLimit: false, atLimit: false },
    };
  }

  const createUsageStats = (current: number, feature: 'boards' | 'submissions' | 'teamMembers') => {
    const limit = getLimit(subscription.tier, feature);
    const percentage = limit > 0 ? (current / limit) * 100 : 0;
    const nearLimit = percentage >= 80;
    const atLimit = current >= limit;

    return { current, limit, percentage, nearLimit, atLimit };
  };

  return {
    submissions: createUsageStats(usage.submissionsThisMonth, 'submissions'),
    boards: createUsageStats(usage.boardsCreated, 'boards'),
    teamMembers: createUsageStats(usage.teamMembersAdded, 'teamMembers'),
  };
}
