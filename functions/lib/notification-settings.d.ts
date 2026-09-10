/**
 * Notification configuration shared by the webhook, digest and submitter flows.
 *
 * Settings live in the private document `companies/{companyId}/private/notifications`
 * so recipient addresses, Slack URLs and webhook secrets are never exposed by the
 * publicly readable company document. Companies configured before that move are
 * still honoured through the legacy `companies/{companyId}.webhooks` fallback.
 */
import * as admin from "firebase-admin";
export declare const NOTIFICATION_DOC = "notifications";
export declare const PRIVATE_COLLECTION = "private";
export type EmailFrequency = "instant" | "daily_digest" | "weekly_digest";
export interface EmailNotificationConfig {
    enabled: boolean;
    recipients: string[];
    events: string[];
    frequency: EmailFrequency;
}
export interface BoardRecipientConfig {
    recipients: string[];
    /** When true the board list replaces the company-wide list instead of extending it. */
    replaceCompany?: boolean;
}
export interface SubmitterPreferences {
    /** Confirmation email to the submitter when their feedback is received. */
    ack: boolean;
    /** Follow-up email when their submission gets a public reply or is resolved. */
    updates: boolean;
}
export interface NotificationSettings {
    email?: EmailNotificationConfig;
    slack?: Record<string, unknown>;
    custom?: Record<string, unknown>;
    boardRecipients?: Record<string, BoardRecipientConfig>;
    submitter?: Partial<SubmitterPreferences>;
}
export declare function notificationDocRef(companyId: string): admin.firestore.DocumentReference;
/** Load a company's notification settings, falling back to the legacy location. */
export declare function getNotificationSettings(companyId: string): Promise<NotificationSettings>;
/** Submitter-facing email preferences, defaulting to enabled. */
export declare function submitterPreferences(settings: NotificationSettings): SubmitterPreferences;
/**
 * Recipients for one board: the company-wide list plus any board-specific
 * addresses, or only the board list when it is configured to replace.
 */
export declare function resolveRecipients(settings: NotificationSettings, boardId?: string): string[];
/** True when email notifications are on and this event is subscribed. */
export declare function emailWantsEvent(settings: NotificationSettings, eventType: string): boolean;
//# sourceMappingURL=notification-settings.d.ts.map