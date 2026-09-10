/**
 * Client access to a company's email notification settings and delivery history.
 *
 * Settings live in the private document `companies/{companyId}/private/notifications`,
 * readable only by owners and admins, so recipient addresses are never served with
 * the publicly readable company document. Configs written before that move are
 * migrated on first save.
 */
import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  BoardRecipients,
  EmailNotificationConfig,
  NotifiableRole,
  NotificationLog,
  NotificationSettings,
} from '@/types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

/** Submission events a company can subscribe to. */
export const NOTIFICATION_EVENTS = [
  { id: 'submission.created', label: 'New submission' },
  { id: 'submission.updated', label: 'Status changed' },
  { id: 'submission.assigned', label: 'Assigned to someone' },
  { id: 'submission.reply_added', label: 'Public reply added' },
  { id: 'submission.resolved', label: 'Marked resolved' },
] as const;

export const EMAIL_FREQUENCIES = [
  { id: 'instant', label: 'Instant', hint: 'Sent the moment it happens.' },
  { id: 'daily_digest', label: 'Daily digest', hint: 'One roll-up each day at 08:00 UTC.' },
  { id: 'weekly_digest', label: 'Weekly digest', hint: 'One roll-up every Monday, 08:00 UTC.' },
] as const;

export const NOTIFIABLE_ROLES: Array<{
  id: NotifiableRole;
  label: string;
  description: string;
}> = [
  { id: 'admin', label: 'Admin', description: 'Manages submissions, team and settings' },
  { id: 'manager', label: 'Manager', description: 'Handles and resolves submissions' },
  { id: 'viewer', label: 'Viewer', description: 'Read-only access' },
];

export const DEFAULT_EMAIL_CONFIG: EmailNotificationConfig = {
  enabled: true,
  roles: ['admin'],
  recipients: [],
  events: ['submission.created'],
  frequency: 'instant',
};

const settingsRef = (companyId: string) =>
  doc(db, 'companies', companyId, 'private', 'notifications');

const companyRef = (companyId: string) => doc(db, 'companies', companyId);

/** Email-only config still stored on the company document, if any. */
async function readLegacySettings(companyId: string): Promise<NotificationSettings | null> {
  const snapshot = await getDoc(companyRef(companyId));
  const legacy = snapshot.data()?.webhooks?.email;
  if (!legacy || typeof legacy !== 'object') return null;

  return {
    email: { ...DEFAULT_EMAIL_CONFIG, ...(legacy as Partial<EmailNotificationConfig>) },
  };
}

/** Load settings, transparently falling back to the legacy location. */
export async function getNotificationSettings(
  companyId: string
): Promise<NotificationSettings> {
  const snapshot = await getDoc(settingsRef(companyId));
  if (snapshot.exists()) return snapshot.data() as NotificationSettings;
  return (await readLegacySettings(companyId)) ?? {};
}

/**
 * Apply a patch to the private settings document. The first save seeds it from the
 * legacy company field and then clears that field, so the publicly readable company
 * document stops carrying recipient addresses.
 *
 * Patch keys may use dot paths (`email.enabled`), so the write goes through
 * updateDoc — the document is created first when it does not exist yet.
 */
async function saveSettings(
  companyId: string,
  patch: Record<string, unknown>
): Promise<void> {
  const ref = settingsRef(companyId);
  const existing = await getDoc(ref);

  if (!existing.exists()) {
    const legacy = await readLegacySettings(companyId);
    await setDoc(ref, { ...(legacy ?? {}), updatedAt: serverTimestamp() });
    if (legacy) {
      await updateDoc(companyRef(companyId), { webhooks: deleteField() });
    }
  }

  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
}

export async function updateEmailNotifications(
  companyId: string,
  config: EmailNotificationConfig
) {
  await saveSettings(companyId, { email: config });
}

export async function setEmailNotificationsEnabled(companyId: string, enabled: boolean) {
  await saveSettings(companyId, { 'email.enabled': enabled });
}

/** Set (or clear, with `null`) the recipients specific to one board. */
export async function updateBoardRecipients(
  companyId: string,
  boardId: string,
  config: BoardRecipients | null
) {
  await saveSettings(companyId, {
    [`boardRecipients.${boardId}`]: config ?? deleteField(),
  });
}

/** Delivery history written by Cloud Functions. */
export async function getNotificationLogs(
  companyId: string,
  options: { status?: NotificationLog['status']; limit?: number } = {}
): Promise<NotificationLog[]> {
  const logsRef = collection(db, 'notification_logs', companyId, 'logs');
  const constraints = [
    ...(options.status ? [where('status', '==', options.status)] : []),
    orderBy('createdAt', 'desc'),
    fbLimit(options.limit ?? 50),
  ];

  const snapshot = await getDocs(query(logsRef, ...constraints));
  return snapshot.docs.map(entry => ({ id: entry.id, ...entry.data() }) as NotificationLog);
}
