/**
 * Emails sent to the person who submitted the feedback:
 *  - a receipt when the submission is created
 *  - a follow-up when a public reply is added or the submission is resolved
 *
 * Both are controlled per company from Settings → Notifications and default to on.
 */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { appUrl, sendMail, SUPPORT_EMAIL } from "./mailer";
import {
  renderSubmissionReceiptEmail,
  renderSubmissionUpdateEmail,
  type SubmissionEmailData,
} from "./email-templates";
import {
  getNotificationSettings,
  submitterPreferences,
} from "./notification-settings";

const db = admin.firestore();

interface Submission {
  id?: string;
  boardId?: string;
  companyId: string;
  trackingCode: string;
  subject: string;
  description?: string;
  category?: string;
  status: string;
  priority?: string;
  submitterEmail?: string;
  isAnonymous?: boolean;
  publicReply?: string;
}

async function lookupNames(submission: Submission): Promise<{
  companyName?: string;
  boardName?: string;
}> {
  const [companyDoc, boardDoc] = await Promise.all([
    db.collection("companies").doc(submission.companyId).get(),
    submission.boardId
      ? db.collection("boards").doc(submission.boardId).get()
      : Promise.resolve(null),
  ]);
  return {
    companyName: companyDoc.data()?.name as string | undefined,
    boardName: (boardDoc?.data()?.name as string | undefined) || undefined,
  };
}

function emailData(
  submission: Submission,
  boardName?: string,
): SubmissionEmailData {
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

/** Submitter address, only when they opted to share it. */
function submitterAddress(submission?: Submission): string | undefined {
  if (!submission || submission.isAnonymous) return undefined;
  return submission.submitterEmail?.trim() || undefined;
}

export const notifySubmitter = functions.firestore
  .document("submissions/{submissionId}")
  .onWrite(async (change, context) => {
    const submission = change.after.data() as Submission | undefined;
    if (!submission) return;

    const to = submitterAddress(submission);
    if (!to) return;

    const previous = change.before.data() as Submission | undefined;
    const isNew = !change.before.exists;
    const gotReply = Boolean(
      submission.publicReply && submission.publicReply !== previous?.publicReply,
    );
    const gotResolved =
      submission.status === "resolved" && previous?.status !== "resolved";

    if (!isNew && !gotReply && !gotResolved) return;

    const prefs = submitterPreferences(
      await getNotificationSettings(submission.companyId),
    );
    if (isNew ? !prefs.ack : !prefs.updates) return;

    const { companyName, boardName } = await lookupNames(submission);
    const trackingUrl = `${appUrl()}/track/${encodeURIComponent(submission.trackingCode)}`;
    const submissionId = context.params.submissionId as string;

    const email = isNew
      ? renderSubmissionReceiptEmail({
        submission: emailData(submission, boardName),
        trackingUrl,
        companyName,
      })
      : renderSubmissionUpdateEmail({
        submission: emailData(submission, boardName),
        trackingUrl,
        companyName,
        reply: gotReply ? submission.publicReply : undefined,
        resolved: gotResolved,
      });

    try {
      await sendMail({
        to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        replyTo: SUPPORT_EMAIL,
        bcc: false,
      });
    } catch (error) {
      functions.logger.error("Failed to send submitter notification", {
        error,
        submissionId,
        event: isNew ? "receipt" : "update",
      });
    }
  });
