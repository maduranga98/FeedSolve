import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, deleteDoc, deleteField } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SlackWebhook, EmailWebhook, CustomWebhook, WebhookLog } from '@/types';

// Webhook management functions
export async function getCompanyWebhooks(companyId: string) {
  const companyDoc = await getDoc(doc(db, 'companies', companyId));
  return companyDoc.data()?.webhooks || {};
}

export async function updateSlackWebhook(companyId: string, slackConfig: SlackWebhook) {
  const webhooksRef = doc(db, 'companies', companyId);
  await updateDoc(webhooksRef, {
    'webhooks.slack': slackConfig,
    'webhooks.enabled': true,
  });
}

export async function updateEmailWebhook(companyId: string, emailConfig: EmailWebhook) {
  const webhooksRef = doc(db, 'companies', companyId);
  await updateDoc(webhooksRef, {
    'webhooks.email': emailConfig,
    'webhooks.enabled': true,
  });
}

export async function updateCustomWebhook(companyId: string, customConfig: CustomWebhook) {
  const webhooksRef = doc(db, 'companies', companyId);
  await updateDoc(webhooksRef, {
    'webhooks.custom': customConfig,
    'webhooks.enabled': true,
  });
}

export async function deleteWebhook(companyId: string, webhookType: 'slack' | 'email' | 'custom') {
  const webhooksRef = doc(db, 'companies', companyId);
  const updateData: Record<string, any> = {};
  updateData[`webhooks.${webhookType}`] = deleteField();
  await updateDoc(webhooksRef, updateData);
}

export async function toggleWebhook(
  companyId: string,
  webhookType: 'slack' | 'email' | 'custom',
  enabled: boolean
) {
  const webhooksRef = doc(db, 'companies', companyId);
  const updateData: Record<string, any> = {};
  updateData[`webhooks.${webhookType}.enabled`] = enabled;
  await updateDoc(webhooksRef, updateData);
}

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
  status: 'success' | 'failed' | 'retrying',
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
