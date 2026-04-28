import { useSubscription } from './useSubscription';

export interface TrialStatus {
  isTrial: boolean;
  isExpired: boolean;
  daysRemaining: number;
  trialEndsAt: Date | null;
}

export function useTrialStatus(): TrialStatus {
  const { subscription } = useSubscription();

  if (!subscription?.trialEndsAt || subscription.tier !== 'free') {
    return { isTrial: false, isExpired: false, daysRemaining: 0, trialEndsAt: null };
  }

  const trialEndsAt = subscription.trialEndsAt.toDate();
  const now = new Date();
  const msRemaining = trialEndsAt.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  const isExpired = msRemaining <= 0;

  return { isTrial: true, isExpired, daysRemaining, trialEndsAt };
}
