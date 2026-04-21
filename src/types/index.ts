import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  companyId: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  status?: 'active' | 'inactive';
  createdAt: Timestamp;
}

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
}

export interface CompanyUsage {
  submissionsThisMonth: number;
  boardsCreated: number;
  teamMembersAdded: number;
  lastResetAt: Timestamp;
}

export interface PaymentMethod {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
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
  webhooks?: WebhookConfig;
  webhookStats?: WebhookStats;
}

export interface Board {
  id: string;
  companyId: string;
  name: string;
  description: string;
  slug: string;
  categories: string[];
  isAnonymousAllowed: boolean;
  qrCodeUrl: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  submissionCount: number;
}

export interface InternalNote {
  id: string;
  text: string;
  createdBy: string;
  createdAt: Timestamp;
}

export interface Submission {
  id: string;
  boardId: string;
  companyId: string;
  trackingCode: string;
  category: string;
  subject: string;
  description: string;
  submitterEmail?: string;
  isAnonymous: boolean;
  status: 'received' | 'in_review' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  internalNotes: InternalNote[];
  publicReply?: string;
  publicReplyAt?: Timestamp;
  publicReplyBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolvedAt?: Timestamp;
}

export interface SubmissionFormInput {
  category: string;
  subject: string;
  description: string;
  email?: string;
  isAnonymous: boolean;
}

export interface BoardFormInput {
  name: string;
  description: string;
  categories: string[];
  isAnonymousAllowed: boolean;
}

export interface TeamInvitation {
  id: string;
  companyId: string;
  email: string;
  role: 'admin' | 'member';
  invitedBy: string;
  inviteCode: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

export interface TeamMember {
  userId: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  joinedAt: Timestamp;
}

export interface Invoice {
  id: string;
  companyId: string;
  stripeCustomerId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  paidAt?: Timestamp;
  dueDate?: Timestamp;
  pdfUrl: string;
  description: string;
  periodStart: Timestamp;
  periodEnd: Timestamp;
  createdAt: Timestamp;
}

export interface BillingEvent {
  id: string;
  companyId: string;
  type: 'upgrade' | 'downgrade' | 'subscription_created' | 'payment_failed' | 'payment_succeeded' | 'cancel';
  fromTier?: string;
  toTier?: string;
  amount?: number;
  reason?: string;
  stripeEventId: string;
  createdAt: Timestamp;
}

export interface TierLimits {
  boards: number;
  submissions: number;
  teamMembers: number;
  canReply: boolean;
  canViewAnalytics: boolean;
  canRemoveBranding: boolean;
  canAccessAPI: boolean;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, companyName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export interface BoardTemplate {
  id: string;
  name: string;
  description: string;
  industry: string;
  icon: string;
  categories: string[];
  sampleQuestions?: string[];
  color: string;
  featured: boolean;
  usageCount: number;
  createdAt: Timestamp;
  translations: Record<string, {
    name: string;
    description: string;
    categories: string[];
  }>;
}

export interface LocalizationSettings {
  defaultLanguage: 'en' | 'si' | 'ta' | 'ar' | 'hi';
  supportedLanguages: string[];
  rtlEnabled: boolean;
}

export interface SlackWebhook {
  enabled: boolean;
  webhookUrl: string;
  channelId?: string;
  events: string[];
  format: 'detailed' | 'compact' | 'minimal';
  mentionOnNew: boolean;
  connectedAt: Timestamp;
}

export interface EmailWebhook {
  enabled: boolean;
  recipients: string[];
  events: string[];
  frequency: 'instant' | 'daily_digest' | 'weekly_digest';
  connectedAt: Timestamp;
}

export interface CustomWebhook {
  enabled: boolean;
  url: string;
  secret: string;
  events: string[];
  connectedAt: Timestamp;
}

export interface WebhookConfig {
  enabled: boolean;
  slack?: SlackWebhook;
  email?: EmailWebhook;
  custom?: CustomWebhook;
}

export interface WebhookStats {
  totalSent: number;
  failureCount: number;
  successRate?: number;
  lastEventAt?: Timestamp;
  nextRetryAt?: Timestamp;
}

export interface WebhookLog {
  id: string;
  companyId: string;
  webhookType: 'slack' | 'email' | 'custom';
  event: string;
  status: 'success' | 'failed' | 'retrying';
  statusCode?: number;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  requestBody: string;
  response?: string;
  createdAt: Timestamp;
  nextRetryAt?: Timestamp;
}
