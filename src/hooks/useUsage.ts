import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';
import { getLimit } from '../lib/tier-limits';
import { getCompanyBoards, getCompanyMembers, getCompanySubmissions } from '../lib/firestore';
import { Timestamp } from 'firebase/firestore';

type UsageStat = {
  current: number;
  limit: number;
  percentage: number;
  nearLimit: boolean;
  atLimit: boolean;
};

const EMPTY: UsageStat = { current: 0, limit: 0, percentage: 0, nearLimit: false, atLimit: false };

export function useUsage() {
  const { user } = useAuth();
  const { subscription, usage } = useSubscription();
  const [live, setLive] = useState<{ submissions: number; boards: number; members: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    (async () => {
      try {
        const [subs, boards, members] = await Promise.all([
          getCompanySubmissions(user.companyId, 1000),
          getCompanyBoards(user.companyId),
          getCompanyMembers(user.companyId),
        ]);
        if (cancelled) return;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonth = subs.filter((s) => {
          const created =
            s.createdAt instanceof Timestamp ? s.createdAt.toDate() : (s.createdAt as unknown as Date);
          return created && created >= startOfMonth;
        }).length;
        setLive({ submissions: thisMonth, boards: boards.length, members: members.length });
      } catch (err) {
        console.error('Failed to compute live usage:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!subscription) {
    return { submissions: EMPTY, boards: EMPTY, teamMembers: EMPTY };
  }

  const createUsageStats = (current: number, feature: 'boards' | 'submissions' | 'teamMembers'): UsageStat => {
    const limit = getLimit(subscription.tier, feature);
    const percentage = limit > 0 ? (current / limit) * 100 : 0;
    const nearLimit = limit > 0 && percentage >= 80;
    const atLimit = limit > 0 && current >= limit;

    return { current, limit, percentage, nearLimit, atLimit };
  };

  const submissionsCurrent = live?.submissions ?? usage?.submissionsThisMonth ?? 0;
  const boardsCurrent = live?.boards ?? usage?.boardsCreated ?? 0;
  const membersCurrent = live?.members ?? usage?.teamMembersAdded ?? 0;

  return {
    submissions: createUsageStats(submissionsCurrent, 'submissions'),
    boards: createUsageStats(boardsCurrent, 'boards'),
    teamMembers: createUsageStats(membersCurrent, 'teamMembers'),
  };
}
