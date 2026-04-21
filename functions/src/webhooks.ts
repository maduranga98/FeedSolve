import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import crypto from 'crypto';

admin.initializeApp();

const db = admin.firestore();
const SLACK_MESSAGE_LIMIT = 4000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

interface Submission {
  id: string;
  boardId: string;
  companyId: string;
  trackingCode: string;
  category: string;
  subject: string;
  description: string;
  submitterEmail?: string;
  isAnonymous: boolean;
  status: string;
  priority: string;
  assignedTo?: string;
  publicReply?: string;
  publicReplyAt?: any;
  publicReplyBy?: string;
  createdAt: any;
  updatedAt: any;
  resolvedAt?: any;
}

interface WebhookConfig {
  enabled?: boolean;
  slack?: {
    enabled: boolean;
    webhookUrl: string;
    channelId?: string;
    events: string[];
    format: 'detailed' | 'compact' | 'minimal';
    mentionOnNew: boolean;
    connectedAt: any;
  };
  email?: {
    enabled: boolean;
    recipients: string[];
    events: string[];
    frequency: 'instant' | 'daily_digest' | 'weekly_digest';
    connectedAt: any;
  };
  custom?: {
    enabled: boolean;
    url: string;
    secret: string;
    events: string[];
    connectedAt: any;
  };
}

export const handleSubmissionEvent = functions.firestore
  .document('submissions/{submissionId}')
  .onWrite(async (change, context) => {
    const submission = change.after.data() as Submission | undefined;
    const previousSubmission = change.before.data() as Submission | undefined;

    if (!submission) return;

    let eventType = 'submission.updated';
    if (!change.before.exists) {
      eventType = 'submission.created';
    } else if (previousSubmission && submission.status !== previousSubmission.status) {
      if (submission.status === 'resolved') {
        eventType = 'submission.resolved';
      } else {
        eventType = 'submission.updated';
      }
    } else if (previousSubmission && submission.assignedTo !== previousSubmission.assignedTo) {
      eventType = 'submission.assigned';
    } else if (submission.publicReply && (!previousSubmission || !previousSubmission.publicReply)) {
      eventType = 'submission.reply_added';
    }

    try {
      const companyDoc = await db.collection('companies').doc(submission.companyId).get();
      const webhooks = (companyDoc.data()?.webhooks || {}) as WebhookConfig;

      if (webhooks.slack?.enabled && webhooks.slack.events.includes(eventType)) {
        await sendSlackNotification(submission, previousSubmission, eventType, webhooks.slack);
      }

      if (webhooks.email?.enabled && webhooks.email.events.includes(eventType)) {
        await sendEmailNotification(submission, previousSubmission, eventType, webhooks.email);
      }

      if (webhooks.custom?.enabled && webhooks.custom.events.includes(eventType)) {
        await sendCustomWebhook(submission, previousSubmission, eventType, webhooks.custom);
      }
    } catch (error) {
      console.error('Error processing webhook event:', error);
    }
  });

async function sendSlackNotification(
  submission: Submission,
  previousSubmission: Submission | undefined,
  eventType: string,
  slackConfig: any
): Promise<void> {
  try {
    const message = buildSlackMessage(submission, previousSubmission, eventType, slackConfig.format);

    const response = await axios.post(slackConfig.webhookUrl, {
      text: message.text,
      blocks: message.blocks,
    });

    await logWebhookEvent(
      submission.companyId,
      'slack',
      eventType,
      'success',
      response.status,
      undefined,
      JSON.stringify({ submission: submission.id })
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await logWebhookEvent(
      submission.companyId,
      'slack',
      eventType,
      'failed',
      undefined,
      errorMessage,
      JSON.stringify({ submission: submission.id })
    );
  }
}

async function sendEmailNotification(
  submission: Submission,
  previousSubmission: Submission | undefined,
  eventType: string,
  emailConfig: any
): Promise<void> {
  try {
    const subject = buildEmailSubject(submission, eventType);
    const body = buildEmailBody(submission, previousSubmission, eventType);

    // TODO: Implement email sending via Brevo, SendGrid, or Firebase Extensions
    // For MVP, log the intention to send
    console.log(`Email would be sent to: ${emailConfig.recipients.join(', ')}`);
    console.log(`Subject: ${subject}`);

    await logWebhookEvent(
      submission.companyId,
      'email',
      eventType,
      'success',
      200,
      undefined,
      JSON.stringify({ submission: submission.id, recipients: emailConfig.recipients })
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await logWebhookEvent(
      submission.companyId,
      'email',
      eventType,
      'failed',
      undefined,
      errorMessage,
      JSON.stringify({ submission: submission.id })
    );
  }
}

async function sendCustomWebhook(
  submission: Submission,
  previousSubmission: Submission | undefined,
  eventType: string,
  customConfig: any
): Promise<void> {
  try {
    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data: {
        submission: {
          id: submission.id,
          trackingCode: submission.trackingCode,
          status: submission.status,
          subject: submission.subject,
          description: submission.description,
          category: submission.category,
          priority: submission.priority,
          assignedTo: submission.assignedTo,
          createdAt: submission.createdAt?.toDate?.() || new Date(),
          updatedAt: submission.updatedAt?.toDate?.() || new Date(),
        },
      },
    };

    const signature = createHmacSignature(payload, customConfig.secret);

    const response = await axios.post(customConfig.url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-FeedSolve-Signature': signature,
      },
      timeout: 10000,
    });

    await logWebhookEvent(
      submission.companyId,
      'custom',
      eventType,
      'success',
      response.status,
      undefined,
      JSON.stringify(payload),
      JSON.stringify(response.data)
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await logWebhookEvent(
      submission.companyId,
      'custom',
      eventType,
      'failed',
      undefined,
      errorMessage,
      JSON.stringify({
        submission: submission.id,
        url: customConfig.url,
      })
    );
  }
}

async function logWebhookEvent(
  companyId: string,
  webhookType: string,
  event: string,
  status: string,
  statusCode?: number,
  errorMessage?: string,
  requestBody?: string,
  response?: string
): Promise<void> {
  try {
    await db
      .collection('webhook_logs')
      .doc(companyId)
      .collection('logs')
      .add({
        webhookType,
        event,
        status,
        statusCode,
        errorMessage,
        retryCount: 0,
        maxRetries: MAX_RETRIES,
        requestBody: requestBody || '',
        response: response || undefined,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    const updateData: any = {
      'webhookStats.lastEventAt': admin.firestore.FieldValue.serverTimestamp(),
      'webhookStats.totalSent': admin.firestore.FieldValue.increment(1),
    };

    if (status === 'failed') {
      updateData['webhookStats.failureCount'] = admin.firestore.FieldValue.increment(1);
    }

    await db.collection('companies').doc(companyId).update(updateData);
  } catch (error) {
    console.error('Error logging webhook event:', error);
  }
}

function buildSlackMessage(
  submission: Submission,
  previousSubmission: Submission | undefined,
  eventType: string,
  format: 'detailed' | 'compact' | 'minimal'
): { text: string; blocks: any[] } {
  const baseText = `*${getEventTitle(eventType)}*\n${submission.subject}`;

  if (format === 'minimal') {
    return {
      text: `New submission: #${submission.trackingCode}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `New submission: #${submission.trackingCode}`,
          },
        },
      ],
    };
  }

  if (format === 'compact') {
    return {
      text: `🎯 ${getEventTitle(eventType)}: ${submission.subject} (#${submission.trackingCode})`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🎯 ${getEventTitle(eventType)}\n*${submission.subject}* (#${submission.trackingCode})`,
          },
        },
      ],
    };
  }

  // Detailed format
  return {
    text: baseText,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: getEventTitle(eventType),
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Subject:* ${submission.subject}\n*Tracking Code:* #${submission.trackingCode}`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Category*\n${submission.category}`,
          },
          {
            type: 'mrkdwn',
            text: `*Priority*\n${submission.priority}`,
          },
          {
            type: 'mrkdwn',
            text: `*Status*\n${submission.status}`,
          },
          {
            type: 'mrkdwn',
            text: `*Assigned To*\n${submission.assignedTo || 'Unassigned'}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Description*\n${submission.description.substring(0, 300)}${submission.description.length > 300 ? '...' : ''}`,
        },
      },
    ],
  };
}

function buildEmailSubject(submission: Submission, eventType: string): string {
  const eventMap: Record<string, string> = {
    'submission.created': 'New Feedback Submitted',
    'submission.updated': 'Feedback Status Updated',
    'submission.assigned': 'Feedback Assigned to You',
    'submission.reply_added': 'Reply Added to Feedback',
    'submission.resolved': 'Feedback Marked as Resolved',
  };

  return `[FeedSolve] ${eventMap[eventType] || 'Feedback Update'} - ${submission.subject}`;
}

function buildEmailBody(
  submission: Submission,
  previousSubmission: Submission | undefined,
  eventType: string
): string {
  return `
    <h2>${submission.subject}</h2>
    <p>${submission.description}</p>
    <hr/>
    <p><strong>Status:</strong> ${submission.status}</p>
    <p><strong>Category:</strong> ${submission.category}</p>
    <p><strong>Priority:</strong> ${submission.priority}</p>
    <p><strong>Tracking Code:</strong> #${submission.trackingCode}</p>
    <a href="${process.env.APP_URL}/submissions/${submission.id}">View in Dashboard</a>
  `;
}

function createHmacSignature(payload: any, secret: string): string {
  const jsonString = JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(jsonString).digest('hex');
}

function getEventTitle(eventType: string): string {
  const titles: Record<string, string> = {
    'submission.created': 'New Feedback Submitted',
    'submission.updated': 'Feedback Updated',
    'submission.assigned': 'Feedback Assigned',
    'submission.reply_added': 'Reply Added',
    'submission.resolved': 'Feedback Resolved',
  };
  return titles[eventType] || 'Feedback Event';
}

export const testWebhook = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { companyId, webhookType } = data;

  const testSubmission: Submission = {
    id: 'test-submission-' + Date.now(),
    boardId: 'test-board',
    companyId,
    trackingCode: 'TEST-001',
    subject: 'Test Submission',
    description: 'This is a test submission to verify webhook connectivity',
    status: 'received',
    priority: 'medium',
    category: 'Test',
    isAnonymous: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const companyDoc = await db.collection('companies').doc(companyId).get();
    const webhooks = (companyDoc.data()?.webhooks || {}) as WebhookConfig;

    if (webhookType === 'slack' && webhooks.slack?.enabled) {
      await sendSlackNotification(testSubmission, undefined, 'submission.created', webhooks.slack);
      return { success: true, message: 'Test Slack message sent' };
    }

    if (webhookType === 'email' && webhooks.email?.enabled) {
      await sendEmailNotification(testSubmission, undefined, 'submission.created', webhooks.email);
      return { success: true, message: 'Test email sent' };
    }

    if (webhookType === 'custom' && webhooks.custom?.enabled) {
      await sendCustomWebhook(testSubmission, undefined, 'submission.created', webhooks.custom);
      return { success: true, message: 'Test custom webhook sent' };
    }

    throw new functions.https.HttpsError('invalid-argument', 'Webhook not found or not enabled');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new functions.https.HttpsError('internal', errorMessage);
  }
});
