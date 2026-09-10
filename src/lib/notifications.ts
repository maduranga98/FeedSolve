/**
 * Client access to a company's notification settings.
 *
 * Settings live in the private document `companies/{companyId}/private/notifications`,
 * readable only by owners/admins, so recipient addresses, Slack URLs and webhook
 * secrets are never served with the publicly readable company document. Configs
 * written before that move are migrated on first save.
 */
import {
  deleteField,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  DEFAULT_SUBMITTER_PREFERENCES,
  type BoardRecipients,
  type CustomWebhook,
  type EmailWebhook,
  type NotificationSettings,
  type SlackWebhook,
  type SubmitterPreferences,
} from '@/types';

export type NotificationChannel = 'slack' | 'email' | 'custom';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

const settingsRef = (companyId: string) =>
  doc(db, 'companies', companyId, 'private', 'notifications');

const companyRef = (companyId: string) => doc(db, 'companies', companyId);

/** Legacy config still stored on the company document, if any. */
async function readLegacySettings(companyId: string): Promise<NotificationSettings | null> {
  const snapshot = await getDoc(companyRef(companyId));
  const legacy = snapshot.data()?.webhooks;
  if (!legacy || typeof legacy !== 'object') return null;

  // `enabled` was a legacy master switch with no equivalent in the new shape.
  const channels = { ...(legacy as Record<string, unknown>) };
  delete channels.enabled;
  return Object.keys(channels).length ? (channels as NotificationSettings) : null;
}

/** Load settings, transparently falling back to the legacy location. */
export async function getNotificationSettings(
  companyId: string
): Promise<NotificationSettings> {
  const snapshot = await getDoc(settingsRef(companyId));
  if (snapshot.exists()) return snapshot.data() as NotificationSettings;
  return (await readLegacySettings(companyId)) ?? {};
}

/** Submitter preferences with defaults applied. */
export function submitterPreferences(
  settings: NotificationSettings | null
): SubmitterPreferences {
  return { ...DEFAULT_SUBMITTER_PREFERENCES, ...(settings?.submitter ?? {}) };
}

/**
 * Apply a patch to the private settings document. The first save seeds the
 * document from the legacy company field and then clears that field, so the
 * publicly readable company doc stops carrying recipients and secrets.
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

export async function updateSlackWebhook(companyId: string, config: SlackWebhook) {
  await saveSettings(companyId, { slack: config });
}

export async function updateEmailWebhook(companyId: string, config: EmailWebhook) {
  await saveSettings(companyId, { email: config });
}

export async function updateCustomWebhook(companyId: string, config: CustomWebhook) {
  await saveSettings(companyId, { custom: config });
}

export async function deleteChannel(companyId: string, channel: NotificationChannel) {
  await saveSettings(companyId, { [channel]: deleteField() });
}

export async function toggleChannel(
  companyId: string,
  channel: NotificationChannel,
  enabled: boolean
) {
  await saveSettings(companyId, { [`${channel}.enabled`]: enabled });
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

export async function updateSubmitterPreferences(
  companyId: string,
  preferences: SubmitterPreferences
) {
  await saveSettings(companyId, { submitter: preferences });
}
