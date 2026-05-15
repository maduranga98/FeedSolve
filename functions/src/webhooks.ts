import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import crypto from "crypto";

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
      const companyDoc = await db
        .collection("companies")
        .doc(submission.companyId)
        .get();
      const webhooks = (companyDoc.data()?.webhooks || {}) as WebhookConfig;

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

      if (
        webhooks.email?.enabled &&
        webhooks.email.events.includes(eventType)
      ) {
        await sendEmailNotification(
          submission,
          previousSubmission,
          eventType,
          webhooks.email,
        );
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

async function sendEmailNotification(
  submission: Submission,
  previousSubmission: Submission | undefined,
  eventType: string,
  emailConfig: Record<string, unknown>,
): Promise<void> {
  const recipients = emailConfig.recipients as string[];
  const subject = buildEmailSubject(submission, eventType);
  const htmlContent = buildEmailHtml(submission, eventType);
  const textContent = buildEmailText(submission, eventType);

  const apiKey = process.env.BREVO_API_KEY || functions.config().brevo?.api_key;
  if (!apiKey) {
    console.warn("BREVO_API_KEY not configured; skipping webhook email notification.");
    return;
  }

  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "FeedSolve",
          email: process.env.BREVO_FROM_EMAIL || "hello@feedsolve.com",
        },
        to: recipients.map((email) => ({ email })),
        subject,
        htmlContent,
        textContent,
      },
      { headers: { "api-key": apiKey, "content-type": "application/json" } },
    );

    await logWebhookEvent(
      submission.companyId,
      "email",
      eventType,
      "success",
      response.status,
      undefined,
      JSON.stringify({ submission: submission.id, recipients }),
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

function buildEmailSubject(submission: Submission, eventType: string): string {
  const eventMap: Record<string, string> = {
    "submission.created": "New Feedback Submitted",
    "submission.updated": "Feedback Status Updated",
    "submission.assigned": "Feedback Assigned to You",
    "submission.reply_added": "Reply Added to Feedback",
    "submission.resolved": "Feedback Marked as Resolved",
  };

  return `[FeedSolve] ${eventMap[eventType] || "Feedback Update"} - ${submission.subject}`;
}

function buildEmailHtml(submission: Submission, eventType: string): string {
  const title = getEventTitle(eventType);
  const statusLabel = submission.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const priorityLabel = submission.priority.charAt(0).toUpperCase() + submission.priority.slice(1);

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#F1F5F8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#3B4A5A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F1F5F8;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(30,58,95,0.08);border:1px solid #E3EDF4;">
        <tr>
          <td style="background:linear-gradient(135deg,#2E86AB 0%,#1E3A5F 100%);padding:20px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-size:20px;font-weight:800;color:#fff;">FeedSolve</td>
                <td align="right" style="font-size:10px;color:rgba(255,255,255,0.75);letter-spacing:1px;text-transform:uppercase;font-weight:600;">Collect. Resolve. Grow.</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 20px;">
            <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#1E3A5F;">${title}</h1>
            <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#3B4A5A;">A submission on your FeedSolve board requires your attention.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F8FAFB;border-radius:10px;padding:16px 18px;margin-bottom:20px;">
              <tr><td style="padding-bottom:8px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;color:#2E86AB;margin-bottom:4px;">Submission</div>
                <div style="font-size:15px;font-weight:600;color:#1E3A5F;">${submission.subject}</div>
                <div style="font-size:12px;color:#7A8896;margin-top:2px;">#${submission.trackingCode}</div>
              </td></tr>
              <tr><td>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="33%" style="padding-top:10px;">
                      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;color:#7A8896;margin-bottom:3px;">Status</div>
                      <div style="font-size:13px;font-weight:600;color:#1E3A5F;">${statusLabel}</div>
                    </td>
                    <td width="33%" style="padding-top:10px;">
                      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;color:#7A8896;margin-bottom:3px;">Priority</div>
                      <div style="font-size:13px;font-weight:600;color:#1E3A5F;">${priorityLabel}</div>
                    </td>
                    <td width="33%" style="padding-top:10px;">
                      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;color:#7A8896;margin-bottom:3px;">Category</div>
                      <div style="font-size:13px;font-weight:600;color:#1E3A5F;">${submission.category}</div>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #EEF3F7;text-align:center;">
            <div style="font-size:12px;font-weight:700;color:#1E3A5F;margin-bottom:4px;">FeedSolve</div>
            <div style="font-size:11px;color:#7A8896;">Collect feedback. Resolve it fast. · <a href="https://feedsolve.com" style="color:#2E86AB;text-decoration:none;">feedsolve.com</a></div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildEmailText(submission: Submission, eventType: string): string {
  const title = getEventTitle(eventType);
  return (
    `FeedSolve — ${title}\n\n` +
    `Submission: ${submission.subject} (#${submission.trackingCode})\n` +
    `Status: ${submission.status}\n` +
    `Priority: ${submission.priority}\n` +
    `Category: ${submission.category}\n\n` +
    `— FeedSolve · Collect feedback. Resolve it fast. · feedsolve.com`
  );
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

  const { companyId, webhookType } = data;

  const testSubmission: Submission = {
    id: "test-submission-" + Date.now(),
    boardId: "test-board",
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
    const companyDoc = await db.collection("companies").doc(companyId).get();
    const webhooks = (companyDoc.data()?.webhooks || {}) as WebhookConfig;

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
      await sendEmailNotification(
        testSubmission,
        undefined,
        "submission.created",
        webhooks.email,
      );
      return { success: true, message: "Test email sent" };
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
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new functions.https.HttpsError("internal", errorMessage);
  }
});
