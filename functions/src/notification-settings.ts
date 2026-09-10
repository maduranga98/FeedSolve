/**
 * Notification configuration shared by the submission, digest and submitter flows.
 *
 * Settings live in the private document `companies/{companyId}/private/notifications`
 * so recipient addresses are never exposed by the publicly readable company
 * document. Companies configured before that move are still honoured through the
 * legacy `companies/{companyId}.webhooks.email` fallback.
 */
import * as admin from "firebase-admin";
import { normaliseRecipients } from "./mailer";

export const PRIVATE_COLLECTION = "private";
export const NOTIFICATION_DOC = "notifications";

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

export interface SubmitterPreferences {
  /** Confirmation email to the submitter when their feedback is received. */
  ack: boolean;
  /** Follow-up when their submission gets a public reply or is resolved. */
  updates: boolean;
}

export interface NotificationSettings {
  email?: Partial<EmailNotificationConfig>;
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
  const privateDoc = await notificationDocRef(companyId).get();
  if (privateDoc.exists) return (privateDoc.data() || {}) as NotificationSettings;

  const companyDoc = await admin
    .firestore()
    .collection("companies")
    .doc(companyId)
    .get();
  const legacyEmail = companyDoc.data()?.webhooks?.email;
  return legacyEmail ? { email: legacyEmail } : {};
}

/** Submitter-facing email preferences, defaulting to enabled. */
export function submitterPreferences(
  settings: NotificationSettings,
): SubmitterPreferences {
  return { ...DEFAULT_SUBMITTER, ...(settings.submitter || {}) };
}

/** Email addresses of every team member holding one of the given roles. */
export async function resolveRoleRecipients(
  companyId: string,
  roles: TeamRole[] | undefined,
): Promise<string[]> {
  if (!roles?.length) return [];

  // Roles are compared case-insensitively: some documents store them capitalised,
  // which an "in" filter would silently miss.
  const wanted = new Set(roles.map((role) => role.toLowerCase()));
  const snapshot = await admin
    .firestore()
    .collection("users")
    .where("companyId", "==", companyId)
    .get();

  return snapshot.docs
    .filter((doc) => wanted.has(String(doc.get("role") || "").toLowerCase()))
    .map((doc) => doc.get("email") as string | undefined)
    .filter((email): email is string => Boolean(email));
}

/**
 * Everyone who should receive a notification for one board: team members in the
 * selected roles, the extra company-wide addresses, and any board-specific
 * addresses — or only the board addresses when it is set to replace.
 */
export async function resolveRecipients(
  companyId: string,
  settings: NotificationSettings,
  boardId?: string,
): Promise<string[]> {
  const board = boardId ? settings.boardRecipients?.[boardId] : undefined;
  const boardRecipients = board?.recipients || [];

  if (board?.replaceCompany && boardRecipients.length) {
    return normaliseRecipients(boardRecipients);
  }

  const roleRecipients = await resolveRoleRecipients(
    companyId,
    settings.email?.roles,
  );
  return normaliseRecipients([
    ...roleRecipients,
    ...(settings.email?.recipients || []),
    ...boardRecipients,
  ]);
}

/** True when email notifications are on and this event is subscribed. */
export function emailWantsEvent(
  settings: NotificationSettings,
  eventType: string,
): boolean {
  const email = settings.email;
  return Boolean(email?.enabled && email.events?.includes(eventType));
}
