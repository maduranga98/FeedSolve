import type { TierLimits } from '../types';

export const tierLimits: Record<string, TierLimits> = {
  free: {
    boards: 2,
    submissions: Infinity,
    teamMembers: 1,
    canReply: false,
    canViewAnalytics: true,
    canRemoveBranding: false,
    canAccessAPI: false,
    analyticsLevel: 'basic',
  },
  starter: {
    boards: 3,
    submissions: 1500,
    teamMembers: 3,
    canReply: false,
    canViewAnalytics: true,
    canRemoveBranding: false,
    canAccessAPI: false,
    analyticsLevel: 'basic',
  },
  growth: {
    boards: 10,
    submissions: 5000,
    teamMembers: 10,
    canReply: true,
    canViewAnalytics: true,
    canRemoveBranding: true,
    canAccessAPI: false,
    analyticsLevel: 'full',
  },
  business: {
    boards: 20,
    submissions: 15000,
    teamMembers: Infinity,
    canReply: true,
    canViewAnalytics: true,
    canRemoveBranding: true,
    canAccessAPI: true,
    analyticsLevel: 'advanced',
  },
};

// Annual prices match actual Stripe product prices (20% discount off monthly × 12)
export const tierPricing = {
  starter: {
    monthly: 19,
    annual: 182,
  },
  growth: {
    monthly: 49,
    annual: 470,
  },
  business: {
    monthly: 79,
    annual: 758,
  },
};

export function getTierLimits(tier: string): TierLimits {
  return tierLimits[tier] || tierLimits.free;
}

export function hasFeature(tier: string, feature: keyof TierLimits): boolean {
  const limits = getTierLimits(tier);
  const value = limits[feature];

  if (typeof value === 'boolean') {
    return value;
  }

  return false;
}

export function getLimit(tier: string, feature: 'boards' | 'submissions' | 'teamMembers'): number {
  const limits = getTierLimits(tier);
  return limits[feature];
}

export function getAnalyticsLevel(tier: string): 'none' | 'basic' | 'full' | 'advanced' {
  return getTierLimits(tier).analyticsLevel;
}

export function analyticsLevelAtLeast(
  tier: string,
  required: 'basic' | 'full' | 'advanced'
): boolean {
  const order = { none: 0, basic: 1, full: 2, advanced: 3 };
  return order[getAnalyticsLevel(tier)] >= order[required];
}
