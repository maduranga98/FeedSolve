/**
 * Notification configuration shared by the submission and digest flows.
 *
 * Settings live in the private document `companies/{companyId}/private/notifications`
 * so recipient addresses are never exposed by the publicly readable company
 * document. Companies configured before that move are still honoured through the
 * legacy `companies/{companyId}.webhooks.email` fallback.
 */
import * as admin from "firebase-admin";
export declare const PRIVATE_COLLECTION = "private";
export declare const NOTIFICATION_DOC = "notifications";
export type EmailFrequency = "instant" | "daily_digest" | "weekly_digest";
export type TeamRole = "owner" | "admin" | "manager" | "viewer";
export interface EmailNotificationConfig {
    enabled: boolean;
    /** Team roles whose members are notified; resolved from the users collection. */
    roles: TeamRole[];
    /** Extra addresses that are not team members (a shared inbox, for example). */
    recipients: string[];
    events: string[];
    frequency: EmailFrequency;
}
export interface BoardRecipientConfig {
    recipients: string[];
    /** When true the board list replaces the company-wide recipients instead of extending them. */
    replaceCompany?: boolean;
}
export interface NotificationSettings {
    email?: Partial<EmailNotificationConfig>;
    boardRecipients?: Record<string, BoardRecipientConfig>;
}
export declare function notificationDocRef(companyId: string): admin.firestore.DocumentReference;
/** Load a company's notification settings, falling back to the legacy location. */
export declare function getNotificationSettings(companyId: string): Promise<NotificationSettings>;
/** Email addresses of every team member holding one of the given roles. */
export declare function resolveRoleRecipients(companyId: string, roles: TeamRole[] | undefined): Promise<string[]>;
/**
 * Everyone who should receive a notification for one board: team members in the
 * selected roles, the extra company-wide addresses, and any board-specific
 * addresses — or only the board addresses when it is set to replace.
 */
export declare function resolveRecipients(companyId: string, settings: NotificationSettings, boardId?: string): Promise<string[]>;
/** True when email notifications are on and this event is subscribed. */
export declare function emailWantsEvent(settings: NotificationSettings, eventType: string): boolean;
//# sourceMappingURL=notification-settings.d.ts.map