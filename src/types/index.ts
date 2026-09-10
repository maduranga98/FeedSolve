import { Timestamp } from "firebase/firestore";

export type UserRole = "owner" | "admin" | "manager" | "viewer";

export interface User {
  id: string;
  companyId: string;
  email: string;
  name: string;
  role: UserRole;
  status?: "active" | "inactive";
  createdAt: Timestamp;
  lastActive?: Timestamp;
}

export interface PermissionAuditLog {
  id: string;
  companyId: string;
  userId: string;
  targetUserId: string;
  action: "role_changed" | "member_added" | "member_removed";
  oldRole?: UserRole;
  newRole?: UserRole;
  reason?: string;
  createdAt: Timestamp;
  createdBy: string;
}

export interface Subscription {
  tier: "free" | "starter" | "growth" | "business";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  priceId?: string;
  billing: "monthly" | "annual";
  currentPeriodStart?: Timestamp;
  currentPeriodEnd?: Timestamp;
  status: "active" | "past_due" | "canceled" | "unpaid";
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

export type FormFieldType =
  | "text"
  | "longtext"
  | "select"
  | "checkbox"
  | "radio"
  | "date"
  | "email"
  | "file"
  | "rating";

export interface ConditionalLogicRule {
  fieldId: string;
  operator: "equals" | "contains" | "notEquals";
  value: string;
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  helpText?: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  conditionalLogic?: ConditionalLogicRule;
  order: number;
}

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

export interface CustomForm {
  enabled: boolean;
  fields: FormField[];
  steps?: FormStep[];
  template?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type RecurringFrequency = "monthly" | "quarterly" | "custom";

export interface BoardCycleStats {
  totalSubmissions: number;
  resolvedSubmissions: number;
  resolutionRate: number;
  avgResolutionHours: number;
}

export interface BoardCycle {
  id: string;
  boardId: string;
  companyId: string;
  cycleNumber: number;
  label: string;
  startDate: Timestamp;
  endDate: Timestamp | null;
  isCurrent: boolean;
  stats: BoardCycleStats;
}

/**
 * Optional localized labels for board categories.
 * Keyed by the canonical category name (the value stored on submissions),
 * then by language code, mapping to the translated label to show submitters.
 * Example: { "Harassment": { "es": "Acoso", "pt": "Assédio" } }
 */
export type CategoryTranslations = Record<string, Record<string, string>>;

export interface Board {
  id: string;
  companyId: string;
  name: string;
  description: string;
  slug: string;
  categories: string[];
  /** When true, categories can carry per-language labels (see categoryTranslations). Off for legacy boards. */
  categoryTranslationsEnabled?: boolean;
  categoryTranslations?: CategoryTranslations;
  locations: string[];
  isAnonymousAllowed: boolean;
  showSatisfactionRating: boolean;
  satisfactionRequired: boolean;
  supportedLanguages?: string[];
  qrCodeUrl: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  submissionCount: number;
  customForm?: CustomForm;
  accessPassword?: string;
  recurringEnabled?: boolean;
  recurringFrequency?: RecurringFrequency | null;
  recurringCustomDays?: number | null;
  recurringStartDate?: Timestamp | null;
  currentCycleId?: string | null;
  nextCycleDate?: Timestamp | null;
}

export interface InternalNote {
  id: string;
  text: string;
  createdBy: string;
  createdAt: Timestamp;
}

export interface FileAttachment {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  uploadedAt: Timestamp;
  uploadedBy: string;
  scanned?: boolean;
  scanStatus?: "pending" | "clean" | "infected";
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
  submitterName?: string;
  submitterMobile?: string;
  location: string | null;
  isAnonymous: boolean;
  status: "received" | "in_review" | "in_progress" | "escalated" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  assignedTo?: string;
  internalNotes: InternalNote[];
  attachments?: FileAttachment[];
  publicReply?: string;
  publicReplyAt?: Timestamp;
  publicReplyBy?: string;
  mergedInto?: string | null;
  mergedSubmissions?: string[];
  isMerged?: boolean;
  mergedAt?: Timestamp | null;
  mergedBy?: string | null;
  cycleId?: string | null;
  submissionLanguage?: string;
  satisfactionScore?: 1 | 2 | 3 | 4 | 5 | null;
  satisfactionLabel?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolvedAt?: Timestamp;
}

export interface SubmissionFormInput {
  category: string;
  subject: string;
  description: string;
  email?: string;
  submitterName?: string;
  submitterMobile?: string;
  location?: string | null;
  isAnonymous: boolean;
  assignedTo?: string;
  submissionLanguage?: string;
  satisfactionScore?: 1 | 2 | 3 | 4 | 5 | null;
  satisfactionLabel?: string | null;
}

export interface BoardFormInput {
  name: string;
  description: string;
  categories: string[];
  categoryTranslationsEnabled?: boolean;
  categoryTranslations?: CategoryTranslations;
  isAnonymousAllowed: boolean;
  showSatisfactionRating: boolean;
  satisfactionRequired: boolean;
  supportedLanguages?: string[];
}

export interface TeamInvitation {
  id: string;
  companyId: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  inviteCode: string;
  status: "pending" | "accepted" | "declined";
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

export interface TeamMember {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  joinedAt: Timestamp;
  lastActive?: Timestamp;
}

export interface Invoice {
  id: string;
  companyId: string;
  stripeCustomerId: string;
  amount: number;
  currency: string;
  status: "draft" | "open" | "paid" | "uncollectible" | "void";
  paidAt?: Timestamp;
  dueDate?: Timestamp;
  pdfUrl?: string | null;
  description?: string;
  periodStart?: Timestamp | null;
  periodEnd?: Timestamp | null;
  createdAt: Timestamp;
}

export interface BillingEvent {
  id: string;
  companyId: string;
  type:
    | "upgrade"
    | "downgrade"
    | "subscription_created"
    | "payment_failed"
    | "payment_succeeded"
    | "cancel";
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
  canUseTemplates: boolean;
  maxTemplates: number;
  analyticsLevel: 'none' | 'basic' | 'full' | 'advanced';
}

export interface ReplyTemplate {
  id: string;
  title: string;
  body: string;
  category: string | null;
  usageCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    name: string,
    companyName: string,
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
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
  translations: Record<
    string,
    {
      name: string;
      description: string;
      categories: string[];
    }
  >;
}

export interface LocalizationSettings {
  defaultLanguage: "en" | "es" | "ar" | "pt";
  supportedLanguages: string[];
  rtlEnabled: boolean;
}

export type EmailFrequency = "instant" | "daily_digest" | "weekly_digest";

/** Company-wide email notification rule for submission activity. */
export interface EmailNotificationConfig {
  enabled: boolean;
  /** Team roles whose members are notified; resolved from the team list. */
  roles: UserRole[];
  /** Extra addresses that are not team members (a shared inbox, for example). */
  recipients: string[];
  events: string[];
  frequency: EmailFrequency;
  updatedAt?: Timestamp;
}

/** Extra (or replacement) notification recipients for a single board. */
export interface BoardRecipients {
  recipients: string[];
  /** When true these addresses replace the company-wide recipients for this board. */
  replaceCompany?: boolean;
}

/** Emails sent to the person who submitted the feedback. */
export interface SubmitterPreferences {
  /** Confirmation email when the submission is received. */
  ack: boolean;
  /** Follow-up when a public reply is added or the submission is resolved. */
  updates: boolean;
}

/**
 * All notification configuration for a company. Stored privately at
 * `companies/{companyId}/private/notifications` — never on the publicly
 * readable company document.
 */
export interface NotificationSettings {
  email?: EmailNotificationConfig;
  boardRecipients?: Record<string, BoardRecipients>;
  submitter?: SubmitterPreferences;
  updatedAt?: Timestamp;
}

export const DEFAULT_SUBMITTER_PREFERENCES: SubmitterPreferences = {
  ack: true,
  updates: true,
};

/** One delivery attempt, written by Cloud Functions. */
export interface NotificationLog {
  id: string;
  companyId: string;
  event: string;
  status: "success" | "failed" | "queued";
  errorMessage?: string | null;
  details?: Record<string, unknown>;
  createdAt: Timestamp;
}

export interface SearchFilters {
  status?: Submission["status"][];
  priority?: Submission["priority"][];
  boardId?: string[];
  category?: string[];
  location?: string[];
  assignedTo?: string;
  dateRange?: {
    from: Timestamp | Date;
    to: Timestamp | Date;
  };
}

export interface SavedFilter {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  filters: SearchFilters;
  createdAt: Timestamp;
  createdBy: string;
  updatedAt?: Timestamp;
  isPinned?: boolean;
}

export interface SearchQuery {
  text: string;
  timestamp: Timestamp;
  filters?: SearchFilters;
  resultCount?: number;
}

export interface SearchResult {
  submission: Submission;
  matchedFields: string[];
  score?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: "newest" | "oldest" | "status" | "priority";
  sortOrder?: "asc" | "desc";
}

export interface QuickFilter {
  id: string;
  label: string;
  filters: SearchFilters;
}

export interface CommentAuthor {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Reaction {
  emoji: string;
  userIds: string[];
}

export interface Comment {
  id: string;
  submissionId: string;
  companyId: string;
  content: string;
  author: CommentAuthor;
  mentions: string[];
  reactions: Reaction[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isEdited: boolean;
  parentCommentId?: string;
}

export interface CommentNotification {
  id: string;
  companyId: string;
  userId: string;
  mentionedBy: string;
  submissionId: string;
  commentId: string;
  isRead: boolean;
  createdAt: Timestamp;
}

export interface FormSubmissionData {
  [fieldId: string]: string | string[] | number | boolean | null;
}

export interface FormTemplate {
  id: string;
  companyId: string;
  name: string;
  description: string;
  form: CustomForm;
  usageCount: number;
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  isPublic: boolean;
}

export interface BulkOperation {
  id: string;
  companyId: string;
  operationType: "status" | "priority" | "assign" | "category" | "delete";
  submissionIds: string[];
  updateData: Record<string, any>;
  status: "pending" | "processing" | "completed" | "failed";
  processedCount: number;
  totalCount: number;
  createdBy: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  errorMessage?: string;
  previousValues?: Array<{
    submissionId: string;
    previousData: Record<string, any>;
  }>;
}

export interface BulkOperationLog {
  id: string;
  companyId: string;
  operationId: string;
  operationType: "status" | "priority" | "assign" | "category" | "delete";
  submissionCount: number;
  createdBy: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: "created" | "completed" | "failed" | "undone";
  details: Record<string, any>;
  createdAt: Timestamp;
}

export interface UndoOperation {
  id: string;
  companyId: string;
  operationId: string;
  originalBulkOperation: BulkOperation;
  restoredAt: Timestamp;
  restoredBy: string;
  expiresAt: Timestamp;
}

export interface AuditLog {
  id: string;
  companyId: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  resourceType: 'submission' | 'board' | 'team' | 'webhook' | 'billing' | 'settings' | 'escalation' | 'template';
  resourceId?: string;
  resourceName?: string;
  details: Record<string, unknown>;
  createdAt: Timestamp;
}

export type { EscalationRule, EscalationLog, EscalationRuleInput, EscalationRuleActions, EscalationRuleConditions, EscalationRuleTrigger, EscalationTriggerType } from './escalationRule';
