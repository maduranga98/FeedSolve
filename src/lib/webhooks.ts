import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { WebhookLog } from '@/types';

// Notification settings CRUD lives in '@/lib/notifications' (private company doc).

// Webhook logs
export async function getWebhookLogs(companyId: string, limit = 50): Promise<WebhookLog[]> {
  const logsRef = collection(db, 'webhook_logs', companyId, 'logs');
  const q = query(logsRef);
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt,
    } as WebhookLog))
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    })
    .slice(0, limit);
}

export async function getWebhookLogsByType(
  companyId: string,
  webhookType: string,
  limit = 50
): Promise<WebhookLog[]> {
  const logsRef = collection(db, 'webhook_logs', companyId, 'logs');
  const q = query(logsRef, where('webhookType', '==', webhookType));
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt,
    } as WebhookLog))
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    })
    .slice(0, limit);
}

export async function getWebhookLogsByStatus(
  companyId: string,
  status: WebhookLog['status'],
  limit = 50
): Promise<WebhookLog[]> {
  const logsRef = collection(db, 'webhook_logs', companyId, 'logs');
  const q = query(logsRef, where('status', '==', status));
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt,
    } as WebhookLog))
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    })
    .slice(0, limit);
}

export const WEBHOOK_EVENTS = [
  { id: 'submission.created', label: 'New Submission' },
  { id: 'submission.updated', label: 'Submission Updated' },
  { id: 'submission.assigned', label: 'Submission Assigned' },
  { id: 'submission.reply_added', label: 'Reply Added' },
  { id: 'submission.resolved', label: 'Submission Resolved' },
];

export const MESSAGE_FORMATS = [
  { id: 'detailed', label: 'Detailed (full information)', icon: '📋' },
  { id: 'compact', label: 'Compact (summary)', icon: '✨' },
  { id: 'minimal', label: 'Minimal (ID only)', icon: '💬' },
];

export const EMAIL_FREQUENCIES = [
  { id: 'instant', label: 'Instant notifications' },
  { id: 'daily_digest', label: 'Daily digest' },
  { id: 'weekly_digest', label: 'Weekly digest' },
];
