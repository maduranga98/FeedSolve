import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import crypto from "crypto";
import { appUrl, sendMail } from "./mailer";
import { renderSubmissionAlertEmail } from "./email-templates";
import {
  emailWantsEvent,
  getNotificationSettings,
  resolveRecipients,
  type NotificationSettings,
} from "./notification-settings";

const db = admin.firestore();
const MAX_RETRIES = 3;

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
  publicReplyAt?: admin.firestore.Timestamp | string | null;
  publicReplyBy?: string;
  createdAt: admin.firestore.Timestamp | string;
  updatedAt: admin.firestore.Timestamp | string;
  resolvedAt?: admin.firestore.Timestamp | string | null;
}

interface WebhookConfig {
  enabled?: boolean;
  slack?: {
    enabled: boolean;
    webhookUrl: string;
    channelId?: string;
    events: string[];
    format: "detailed" | "compact" | "minimal";
    mentionOnNew: boolean;
    connectedAt: admin.firestore.Timestamp | string;
  };
  email?: {
    enabled: boolean;
    recipients: string[];
    events: string[];
    frequency: "instant" | "daily_digest" | "weekly_digest";
    connectedAt: admin.firestore.Timestamp | string;
  };
  custom?: {
    enabled: boolean;
    url: string;
    secret: string;
    events: string[];
    connectedAt: admin.firestore.Timestamp | string;
  };
}

export const handleSubmissionEvent = functions.firestore
  .document("submissions/{submissionId}")
  .onWrite(async (change) => {
    const submission = change.after.data() as Submission | undefined;
    const previousSubmission = change.before.data() as Submission | undefined;

    if (!submission) return;

    // Submission documents do not store their own id; take it from the trigger
    // so links and log payloads point at the real document.
    submission.id = change.after.id;

    let eventType = "submission.updated";
    if (!change.before.exists) {
      eventType = "submission.created";
    } else if (
      previousSubmission &&
      submission.status !== previousSubmission.status
    ) {
      if (submission.status === "resolved") {
        eventType = "submission.resolved";
      } else {
        eventType = "submission.updated";
      }
    } else if (
      previousSubmission &&
      submission.assignedTo !== previousSubmission.assignedTo
    ) {
      eventType = "submission.assigned";
    } else if (
      submission.publicReply &&
      (!previousSubmission || !previousSubmission.publicReply)
    ) {
      eventType = "submission.reply_added";
    }

    try {
      const webhooks = (await getNotificationSettings(
        submission.companyId,
      )) as NotificationSettings & WebhookConfig;

      if (
        webhooks.slack?.enabled &&
        webhooks.slack.events.includes(eventType)
      ) {
        await sendSlackNotification(
          submission,
          previousSubmission,
          eventType,
          webhooks.slack,
        );
      }

      if (emailWantsEvent(webhooks, eventType)) {
        await deliverEmailNotification(submission, eventType, webhooks);
      }

      if (
        webhooks.custom?.enabled &&
        webhooks.custom.events.includes(eventType)
      ) {
        await sendCustomWebhook(
          submission,
          previousSubmission,
          eventType,
          webhooks.custom,
        );
      }
    } catch (error) {
      console.error("Error processing webhook event:", error);
    }
  });

async function sendSlackNotification(
  submission: Submission,
  previousSubmission: Submission | undefined,
  eventType: string,
  slackConfig: Record<string, unknown>,
): Promise<void> {
  try {
    const message = buildSlackMessage(
      submission,
      previousSubmission,
      eventType,
      slackConfig.format as string,
    );

    const response = await axios.post(slackConfig.webhookUrl as string, {
      text: message.text,
      blocks: message.blocks,
    });

    await logWebhookEvent(
      submission.companyId,
      "slack",
      eventType,
      "success",
      response.status,
      undefined,
      JSON.stringify({ submission: submission.id }),
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await logWebhookEvent(
      submission.companyId,
      "slack",
      eventType,
      "failed",
      undefined,
      errorMessage,
      JSON.stringify({ submission: submission.id }),
    );
  }
}

/** Board name for email context; never fails the notification. */
async function getBoardName(boardId?: string): Promise<string | undefined> {
  if (!boardId) return undefined;
  try {
    const boardDoc = await db.collection("boards").doc(boardId).get();
    return (boardDoc.data()?.name as string | undefined) || undefined;
  } catch {
    return undefined;
  }
}

function toEmailData(submission: Submission, boardName?: string) {
  return {
    trackingCode: submission.trackingCode,
    subject: submission.subject,
    description: submission.description,
    category: submission.category,
    status: submission.status,
    priority: submission.priority,
    boardName,
  };
}

/**
 * Route an email notification: instant delivery, or queued for the
 * daily/weekly digest when that frequency is configured.
 */
async function deliverEmailNotification(
  submission: Submission,
  eventType: string,
  settings: NotificationSettings,
): Promise<void> {
  const recipients = resolveRecipients(settings, submission.boardId);
  if (!recipients.length) return;

  const frequency = settings.email?.frequency || "instant";
  const boardName = await getBoardName(submission.boardId);

  if (frequency === "instant") {
    await sendEmailNotification(submission, eventType, recipients, boardName);
    return;
  }

  await queueDigestEvent(submission, eventType, recipients, frequency, boardName);
}

/** Store an event for the next digest run instead of emailing immediately. */
async function queueDigestEvent(
  submission: Submission,
  eventType: string,
  recipients: string[],
  frequency: "daily_digest" | "weekly_digest",
  boardName?: string,
): Promise<void> {
  try {
    await db
      .collection("notification_digests")
      .doc(submission.companyId)
      .collection("events")
      .add({
        companyId: submission.companyId,
        eventType,
        frequency,
        recipients,
        submission: toEmailData(submission, boardName),
        submissionId: submission.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    await logWebhookEvent(
      submission.companyId,
      "email",
      eventType,
      "queued",
      202,
      undefined,
      JSON.stringify({ submission: submission.id, frequency, recipients: recipients.length }),
    );
  } catch (error) {
    functions.logger.error("Failed to queue digest event", { error });
  }
}

async function sendEmailNotification(
  submission: Submission,
  eventType: string,
  recipients: string[],
  boardName?: string,
): Promise<void> {
  const base = appUrl();
  const email = renderSubmissionAlertEmail({
    eventType,
    submission: toEmailData(submission, boardName),
    submissionUrl: `${base}/submission/${submission.id}`,
    settingsUrl: `${base}/notifications`,
  });

  try {
    const sent = await sendMail({
      to: recipients,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
    if (!sent) return;

    await logWebhookEvent(
      submission.companyId,
      "email",
      eventType,
      "success",
      250,
      undefined,
      JSON.stringify({ submission: submission.id, recipients: recipients.length }),
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await logWebhookEvent(
      submission.companyId,
      "email",
      eventType,
      "failed",
      undefined,
      errorMessage,
      JSON.stringify({ submission: submission.id }),
    );
  }
}

async function sendCustomWebhook(
  submission: Submission,
  previousSubmission: Submission | undefined,
  eventType: string,
  customConfig: Record<string, unknown>,
): Promise<void> {
  try {
    const payload: Record<string, unknown> = {
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
          createdAt: (submission.createdAt as admin.firestore.Timestamp)?.toDate?.() || new Date(),
          updatedAt: (submission.updatedAt as admin.firestore.Timestamp)?.toDate?.() || new Date(),
        },
      },
    };

    const signature = createHmacSignature(
      payload,
      customConfig.secret as string,
    );

    const response = await axios.post(customConfig.url as string, payload, {
      headers: {
        "Content-Type": "application/json",
        "X-FeedSolve-Signature": signature,
      },
      timeout: 10000,
    });

    await logWebhookEvent(
      submission.companyId,
      "custom",
      eventType,
      "success",
      response.status,
      undefined,
      JSON.stringify(payload),
      JSON.stringify(response.data),
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await logWebhookEvent(
      submission.companyId,
      "custom",
      eventType,
      "failed",
      undefined,
      errorMessage,
      JSON.stringify({
        submission: submission.id,
        url: customConfig.url,
      }),
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
  response?: string,
): Promise<void> {
  try {
    await db
      .collection("webhook_logs")
      .doc(companyId)
      .collection("logs")
      .add({
        webhookType,
        event,
        status,
        statusCode,
        errorMessage,
        retryCount: 0,
        maxRetries: MAX_RETRIES,
        requestBody: requestBody || "",
        response: response || undefined,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    const updateData: Record<string, unknown> = {
      "webhookStats.lastEventAt": admin.firestore.FieldValue.serverTimestamp(),
      "webhookStats.totalSent": admin.firestore.FieldValue.increment(1),
    };

    if (status === "failed") {
      (updateData as Record<string, unknown>)["webhookStats.failureCount"] =
        admin.firestore.FieldValue.increment(1);
    }

    await db.collection("companies").doc(companyId).update(updateData);
  } catch (error) {
    console.error("Error logging webhook event:", error);
  }
}

function buildSlackMessage(
  submission: Submission,
  previousSubmission: Submission | undefined,
  eventType: string,
  format: string,
): { text: string; blocks: Record<string, unknown>[] } {
  const baseText = `*${getEventTitle(eventType)}*\n${submission.subject}`;

  if (format === "minimal") {
    return {
      text: `New submission: #${submission.trackingCode}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `New submission: #${submission.trackingCode}`,
          },
        },
      ],
    };
  }

  if (format === "compact") {
    return {
      text: `🎯 ${getEventTitle(eventType)}: ${submission.subject} (#${submission.trackingCode})`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
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
        type: "header",
        text: {
          type: "plain_text",
          text: getEventTitle(eventType),
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Subject:* ${submission.subject}\n*Tracking Code:* #${submission.trackingCode}`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Category*\n${submission.category}`,
          },
          {
            type: "mrkdwn",
            text: `*Priority*\n${submission.priority}`,
          },
          {
            type: "mrkdwn",
            text: `*Status*\n${submission.status}`,
          },
          {
            type: "mrkdwn",
            text: `*Assigned To*\n${submission.assignedTo || "Unassigned"}`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Description*\n${submission.description.substring(0, 300)}${submission.description.length > 300 ? "..." : ""}`,
        },
      },
    ],
  };
}

function createHmacSignature(
  payload: Record<string, unknown>,
  secret: string,
): string {
  const jsonString = JSON.stringify(payload);
  return crypto.createHmac("sha256", secret).update(jsonString).digest("hex");
}

function getEventTitle(eventType: string): string {
  const titles: Record<string, string> = {
    "submission.created": "New Feedback Submitted",
    "submission.updated": "Feedback Updated",
    "submission.assigned": "Feedback Assigned",
    "submission.reply_added": "Reply Added",
    "submission.resolved": "Feedback Resolved",
  };
  return titles[eventType] || "Feedback Event";
}

export const testWebhook = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated",
    );
  }

  const { companyId, webhookType, boardId } = data as {
    companyId?: string;
    webhookType?: string;
    boardId?: string;
  };

  if (!companyId || !webhookType) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "companyId and webhookType are required",
    );
  }

  // Only owners/admins of that company may fire test notifications.
  const callerDoc = await db.collection("users").doc(context.auth.uid).get();
  const caller = callerDoc.data();
  const callerRole = (caller?.role as string | undefined)?.toLowerCase();
  if (
    caller?.companyId !== companyId ||
    !["owner", "admin"].includes(callerRole || "")
  ) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You do not have permission to test this company's notifications",
    );
  }

  const testSubmission: Submission = {
    id: "test-submission-" + Date.now(),
    boardId: boardId || "test-board",
    companyId,
    trackingCode: "TEST-001",
    subject: "Test Submission",
    description: "This is a test submission to verify webhook connectivity",
    status: "received",
    priority: "medium",
    category: "Test",
    isAnonymous: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const webhooks = (await getNotificationSettings(
      companyId,
    )) as NotificationSettings & WebhookConfig;

    if (webhookType === "slack" && webhooks.slack?.enabled) {
      await sendSlackNotification(
        testSubmission,
        undefined,
        "submission.created",
        webhooks.slack,
      );
      return { success: true, message: "Test Slack message sent" };
    }

    if (webhookType === "email" && webhooks.email?.enabled) {
      const recipients = resolveRecipients(webhooks, testSubmission.boardId);
      if (!recipients.length) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Add at least one recipient before sending a test email",
        );
      }
      // A test always sends immediately, even on a digest schedule.
      await sendEmailNotification(
        testSubmission,
        "submission.created",
        recipients,
      );
      return {
        success: true,
        message: `Test email sent to ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}`,
      };
    }

    if (webhookType === "custom" && webhooks.custom?.enabled) {
      await sendCustomWebhook(
        testSubmission,
        undefined,
        "submission.created",
        webhooks.custom,
      );
      return { success: true, message: "Test custom webhook sent" };
    }

    throw new functions.https.HttpsError(
      "invalid-argument",
      "Webhook not found or not enabled",
    );
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new functions.https.HttpsError("internal", errorMessage);
  }
});
