/**
 * Team email notifications for submission activity.
 *
 * Recipients come from the roles and addresses configured at Settings →
 * Notifications; delivery is either instant or queued for the daily/weekly
 * digest. Every attempt is recorded in `notification_logs/{companyId}/logs`.
 */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { appUrl, sendMail, SUPPORT_EMAIL } from "./mailer";
import {
  renderSubmissionAlertEmail,
  renderUnconfiguredRecipientsEmail,
  type SubmissionEmailData,
} from "./email-templates";
import {
  emailWantsEvent,
  getNotificationSettings,
  resolveRecipients,
  resolveRoleRecipients,
  type EmailFrequency,
  type NotificationSettings,
} from "./notification-settings";

const db = admin.firestore();

export interface Submission {
  id?: string;
  boardId: string;
  companyId: string;
  trackingCode: string;
  category?: string;
  subject: string;
  description?: string;
  status: string;
  priority?: string;
  assignedTo?: string;
  publicReply?: string;
}

/** Classify a submission write into one of the notifiable events. */
function resolveEventType(
  submission: Submission,
  previous: Submission | undefined,
  isNew: boolean,
): string {
  if (isNew) return "submission.created";
  if (!previous) return "submission.updated";
  if (submission.status !== previous.status) {
    return submission.status === "resolved"
      ? "submission.resolved"
      : "submission.updated";
  }
  if (submission.assignedTo !== previous.assignedTo) return "submission.assigned";
  if (submission.publicReply && !previous.publicReply) return "submission.reply_added";
  return "submission.updated";
}

/** Board name for email context; never fails the notification. */
async function getBoardName(boardId?: string): Promise<string | undefined> {
  if (!boardId) return undefined;
  try {
    const boardDoc = await db.collection("boards").doc(boardId).get();
    return (boardDoc.get("name") as string | undefined) || undefined;
  } catch {
    return undefined;
  }
}

function toEmailData(
  submission: Submission,
  boardName?: string,
): SubmissionEmailData {
  return {
    trackingCode: submission.trackingCode,
    subject: submission.subject,
    category: submission.category,
    status: submission.status,
    priority: submission.priority,
    boardName,
  };
}

async function logNotification(
  companyId: string,
  event: string,
  status: "success" | "failed" | "queued",
  details: Record<string, unknown>,
  errorMessage?: string,
): Promise<void> {
  try {
    await db
      .collection("notification_logs")
      .doc(companyId)
      .collection("logs")
      .add({
        companyId,
        event,
        status,
        errorMessage: errorMessage ?? null,
        details,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
  } catch (error) {
    functions.logger.error("Failed to write notification log", { error });
  }
}

/** Store an event for the next digest run instead of emailing immediately. */
async function queueDigestEvent(
  submission: Submission,
  eventType: string,
  recipients: string[],
  frequency: Exclude<EmailFrequency, "instant">,
  boardName?: string,
): Promise<void> {
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

  await logNotification(submission.companyId, eventType, "queued", {
    submissionId: submission.id,
    frequency,
    recipients: recipients.length,
  });
}

export async function sendNotificationEmail(
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

    await logNotification(submission.companyId, eventType, "success", {
      submissionId: submission.id,
      recipients: recipients.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await logNotification(
      submission.companyId,
      eventType,
      "failed",
      { submissionId: submission.id, recipients: recipients.length },
      message,
    );
    throw error;
  }
}

/**
 * Last-resort alert to FeedSolve support, used only when a company has no
 * notification recipients configured AND no admin to fall back to either
 * (should not normally happen — every account has an admin).
 */
async function notifySupportOfMissingRecipients(
  submission: Submission,
  eventType: string,
  boardName?: string,
): Promise<void> {
  const base = appUrl();
  const email = renderUnconfiguredRecipientsEmail({
    companyId: submission.companyId,
    eventType,
    submission: toEmailData(submission, boardName),
    submissionUrl: `${base}/submission/${submission.id}`,
  });

  try {
    await sendMail({
      to: SUPPORT_EMAIL,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  } catch (error) {
    functions.logger.error("Failed to send missing-recipients alert", {
      error,
      companyId: submission.companyId,
      submissionId: submission.id,
    });
  }
}

/** Instant delivery, or queued for the configured digest. */
async function deliver(
  submission: Submission,
  eventType: string,
  settings: NotificationSettings,
): Promise<void> {
  const recipients = await resolveRecipients(
    submission.companyId,
    settings,
    submission.boardId,
  );
  const boardName = await getBoardName(submission.boardId);

  if (!recipients.length) {
    const adminRecipients = await resolveRoleRecipients(submission.companyId, ["admin"]);
    if (adminRecipients.length) {
      await sendNotificationEmail(submission, eventType, adminRecipients, boardName);
    } else {
      await notifySupportOfMissingRecipients(submission, eventType, boardName);
    }
    return;
  }

  const frequency = settings.email?.frequency || "instant";

  if (frequency === "instant") {
    await sendNotificationEmail(submission, eventType, recipients, boardName);
    return;
  }
  await queueDigestEvent(submission, eventType, recipients, frequency, boardName);
}

export const onSubmissionNotification = functions
  .runWith({ secrets: ["SMTP_PASS"] })
  .firestore.document("submissions/{submissionId}")
  .onWrite(async (change) => {
    const submission = change.after.data() as Submission | undefined;
    if (!submission) return;

    // Submission documents do not store their own id.
    submission.id = change.after.id;

    const previous = change.before.data() as Submission | undefined;
    const eventType = resolveEventType(submission, previous, !change.before.exists);

    try {
      const settings = await getNotificationSettings(submission.companyId);
      if (!emailWantsEvent(settings, eventType)) return;
      await deliver(submission, eventType, settings);
    } catch (error) {
      functions.logger.error("Failed to process submission notification", {
        error,
        submissionId: submission.id,
        eventType,
      });
    }
  });

/** Send a sample notification to the configured recipients (owner/admin only). */
export const sendTestNotification = functions
  .runWith({ secrets: ["SMTP_PASS"] })
  .https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated",
    );
  }

  const { companyId } = (data || {}) as { companyId?: string };
  if (!companyId) {
    throw new functions.https.HttpsError("invalid-argument", "companyId is required");
  }

  const caller = (await db.collection("users").doc(context.auth.uid).get()).data();
  const callerRole = (caller?.role as string | undefined)?.toLowerCase();
  if (caller?.companyId !== companyId || !["owner", "admin"].includes(callerRole || "")) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You do not have permission to test this company's notifications",
    );
  }

  const settings = await getNotificationSettings(companyId);
  const recipients = await resolveRecipients(companyId, settings);
  if (!recipients.length) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Save a role or an email address before sending a test",
    );
  }

  const testSubmission: Submission = {
    id: "test",
    boardId: "test-board",
    companyId,
    trackingCode: "TEST-001",
    subject: "Test notification",
    description: "This is a test of your FeedSolve email notifications.",
    category: "Test",
    status: "received",
    priority: "medium",
  };

  try {
    // A test always sends immediately, even on a digest schedule.
    await sendNotificationEmail(testSubmission, "submission.created", recipients);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new functions.https.HttpsError("internal", message);
  }

  return {
    success: true,
    recipients: recipients.length,
    message: `Test email sent to ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}`,
  };
});
