import type { Timestamp } from 'firebase/firestore';

export interface Subscription {
  tier: 'free' | 'starter' | 'growth' | 'business';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  priceId?: string;
  billing: 'monthly' | 'annual';
  currentPeriodStart?: Timestamp;
  currentPeriodEnd?: Timestamp;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid';
  canceledAt?: Timestamp;
  upgradedAt?: Timestamp;
  downgradedAt?: Timestamp;
  trialEndsAt?: Timestamp;
}

export interface StorageUsage {
  totalBytes: number;
  usedBytes: number;
  lastResetAt: Timestamp;
}

export interface CompanyUsage {
  submissionsThisMonth: number;
  boardsCreated: number;
  teamMembersAdded: number;
  lastResetAt: Timestamp;
  storage?: StorageUsage;
}

export interface PaymentMethod {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export interface CompanyBranding {
  logoUrl?: string;
  logoStoragePath?: string;
  companyName?: string;
  slogan?: string;
  description?: string;
  address?: string;
  contactNumber?: string;
  contactEmail?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface Company {
  id: string;
  name: string;
  email: string;
  billingEmail?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  subscription: Subscription;
  usage: CompanyUsage;
  paymentMethod?: PaymentMethod;
  monthlySubmissionLimit: number;
  boardCount: number;
  branding?: CompanyBranding;
  showPublicFeed?: boolean;
  companySlug?: string;
  publicFeedTitle?: string | null;
  publicFeedMessage?: string | null;
  showPublicFeedbackLink?: boolean;
}
