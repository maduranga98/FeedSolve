/**
 * Daily and weekly digests for companies whose email notification frequency is
 * not "instant". Events are queued by the submission webhook trigger into
 * `notification_digests/{companyId}/events` and drained here.
 */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { appUrl, sendMail } from "./mailer";
import { renderDigestEmail, type SubmissionEmailData } from "./email-templates";

const db = admin.firestore();
const BATCH_LIMIT = 400;

interface DigestEvent {
  eventType: string;
  frequency: "daily_digest" | "weekly_digest";
  recipients: string[];
  submission: SubmissionEmailData;
}

/** Send one digest per distinct recipient set so nobody sees another board's mail. */
function groupByRecipients(
  events: Array<{ id: string; data: DigestEvent }>,
): Map<string, { recipients: string[]; items: DigestEvent[] }> {
  const groups = new Map<string, { recipients: string[]; items: DigestEvent[] }>();
  for (const { data } of events) {
    const recipients = [...(data.recipients || [])].sort();
    if (!recipients.length) continue;
    const key = recipients.join("|");
    const group = groups.get(key) || { recipients, items: [] };
    group.items.push(data);
    groups.set(key, group);
  }
  return groups;
}

async function runDigest(frequency: "daily_digest" | "weekly_digest") {
  const period = frequency === "daily_digest" ? "daily" : "weekly";
  const base = appUrl();

  // Parent docs are implicit; listDocuments still returns refs that own subcollections.
  const companyRefs = await db.collection("notification_digests").listDocuments();

  const byCompany = new Map<string, Array<{ id: string; data: DigestEvent }>>();
  for (const companyRef of companyRefs) {
    const queued = await companyRef
      .collection("events")
      .where("frequency", "==", frequency)
      .limit(BATCH_LIMIT * 5)
      .get();
    if (queued.empty) continue;
    byCompany.set(
      companyRef.id,
      queued.docs.map((doc) => ({ id: doc.id, data: doc.data() as DigestEvent })),
    );
  }

  for (const [companyId, events] of byCompany) {
    for (const group of groupByRecipients(events).values()) {
      const email = renderDigestEmail({
        period,
        items: group.items.map((item) => ({
          eventType: item.eventType,
          submission: item.submission,
        })),
        dashboardUrl: `${base}/dashboard`,
        settingsUrl: `${base}/notifications`,
      });

      try {
        await sendMail({
          to: group.recipients,
          subject: email.subject,
          html: email.html,
          text: email.text,
        });
      } catch (error) {
        functions.logger.error("Failed to send digest", { error, companyId });
        // Leave the events queued so the next run retries them.
        continue;
      }
    }

    // Clear the queue for this company once its digests are out.
    const collection = db
      .collection("notification_digests")
      .doc(companyId)
      .collection("events");
    for (let i = 0; i < events.length; i += BATCH_LIMIT) {
      const batch = db.batch();
      for (const event of events.slice(i, i + BATCH_LIMIT)) {
        batch.delete(collection.doc(event.id));
      }
      await batch.commit();
    }
  }
}

/** Every day at 08:00 UTC. */
export const sendDailyDigests = functions.pubsub
  .schedule("0 8 * * *")
  .timeZone("UTC")
  .onRun(async () => {
    await runDigest("daily_digest");
  });

/** Mondays at 08:00 UTC. */
export const sendWeeklyDigests = functions.pubsub
  .schedule("0 8 * * 1")
  .timeZone("UTC")
  .onRun(async () => {
    await runDigest("weekly_digest");
  });
