import type { TierLimits } from '../types';

export const tierLimits: Record<string, TierLimits> = {
  free: {
    boards: 1,
    submissions: 50,
    teamMembers: 1,
    canReply: false,
    canViewAnalytics: false,
    canRemoveBranding: false,
    canAccessAPI: false,
  },
  starter: {
    boards: 3,
    submissions: 500,
    teamMembers: 3,
    canReply: false,
    canViewAnalytics: true,
    canRemoveBranding: false,
    canAccessAPI: false,
  },
  growth: {
    boards: 10,
    submissions: 5000,
    teamMembers: 10,
    canReply: true,
    canViewAnalytics: true,
    canRemoveBranding: true,
    canAccessAPI: false,
  },
  business: {
    boards: 999,
    submissions: 999999,
    teamMembers: 999,
    canReply: true,
    canViewAnalytics: true,
    canRemoveBranding: true,
    canAccessAPI: true,
  },
};

export const tierPricing = {
  starter: {
    monthly: 19,
    annual: 228,
  },
  growth: {
    monthly: 49,
    annual: 588,
  },
  business: {
    monthly: 129,
    annual: 1548,
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
