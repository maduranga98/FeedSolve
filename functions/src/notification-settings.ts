/**
 * Notification configuration shared by the webhook, digest and submitter flows.
 *
 * Settings live in the private document `companies/{companyId}/private/notifications`
 * so recipient addresses, Slack URLs and webhook secrets are never exposed by the
 * publicly readable company document. Companies configured before that move are
 * still honoured through the legacy `companies/{companyId}.webhooks` fallback.
 */
import * as admin from "firebase-admin";
import { normaliseRecipients } from "./mailer";

export const NOTIFICATION_DOC = "notifications";
export const PRIVATE_COLLECTION = "private";

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

const DEFAULT_SUBMITTER: SubmitterPreferences = { ack: true, updates: true };

export function notificationDocRef(
  companyId: string,
): admin.firestore.DocumentReference {
  return admin
    .firestore()
    .collection("companies")
    .doc(companyId)
    .collection(PRIVATE_COLLECTION)
    .doc(NOTIFICATION_DOC);
}

/** Load a company's notification settings, falling back to the legacy location. */
export async function getNotificationSettings(
  companyId: string,
): Promise<NotificationSettings> {
  const [privateDoc, companyDoc] = await Promise.all([
    notificationDocRef(companyId).get(),
    admin.firestore().collection("companies").doc(companyId).get(),
  ]);

  const legacy = (companyDoc.data()?.webhooks || {}) as NotificationSettings;
  if (!privateDoc.exists) return legacy;

  const current = (privateDoc.data() || {}) as NotificationSettings;
  return {
    ...legacy,
    ...current,
    submitter: { ...legacy.submitter, ...current.submitter },
  };
}

/** Submitter-facing email preferences, defaulting to enabled. */
export function submitterPreferences(
  settings: NotificationSettings,
): SubmitterPreferences {
  return { ...DEFAULT_SUBMITTER, ...(settings.submitter || {}) };
}

/**
 * Recipients for one board: the company-wide list plus any board-specific
 * addresses, or only the board list when it is configured to replace.
 */
export function resolveRecipients(
  settings: NotificationSettings,
  boardId?: string,
): string[] {
  const companyRecipients = settings.email?.recipients || [];
  const board = boardId ? settings.boardRecipients?.[boardId] : undefined;
  const boardRecipients = board?.recipients || [];

  if (board?.replaceCompany && boardRecipients.length) {
    return normaliseRecipients(boardRecipients);
  }
  return normaliseRecipients([...companyRecipients, ...boardRecipients]);
}

/** True when email notifications are on and this event is subscribed. */
export function emailWantsEvent(
  settings: NotificationSettings,
  eventType: string,
): boolean {
  const email = settings.email;
  return Boolean(email?.enabled && email.events?.includes(eventType));
}
