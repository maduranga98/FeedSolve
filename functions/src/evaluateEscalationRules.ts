import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";

const db = admin.firestore();

type TriggerType = "time_since_created" | "time_since_status_change" | "time_unassigned";

interface EscalationRule {
  id?: string;
  name: string;
  isActive: boolean;
  trigger: { type: TriggerType; hours: number };
  conditions: {
    priority?: string[];
    status?: string[];
    boardId?: string | null;
    isUnassigned?: boolean;
  };
  actions: {
    changePriority?: string;
    changeStatus?: string;
    assignTo?: string;
    notifyEmails?: string[];
    addInternalComment?: string;
  };
}

interface Submission {
  id?: string;
  companyId: string;
  boardId: string;
  trackingCode?: string;
  subject?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  createdAt?: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
}

function hoursBetween(start: admin.firestore.Timestamp | undefined, end: admin.firestore.Timestamp) {
  if (!start) return 0;
  return (end.toMillis() - start.toMillis()) / (1000 * 60 * 60);
}

function triggerStart(submission: Submission, type: TriggerType) {
  if (type === "time_since_created") return submission.createdAt;
  if (type === "time_since_status_change") return submission.updatedAt ?? submission.createdAt;
  return submission.createdAt;
}

function matchesConditions(submission: Submission, rule: EscalationRule) {
  const { conditions } = rule;
  if (conditions.boardId && submission.boardId !== conditions.boardId) return false;
  if (conditions.priority?.length && !conditions.priority.includes(submission.priority ?? "")) return false;
  if (conditions.status?.length && !conditions.status.includes(submission.status ?? "")) return false;
  if ((conditions.isUnassigned || rule.trigger.type === "time_unassigned") && submission.assignedTo) return false;
  return true;
}

async function alreadyTriggered(submissionId: string, ruleId: string) {
  const existing = await db
    .collection("submissions")
    .doc(submissionId)
    .collection("escalationLog")
    .where("ruleId", "==", ruleId)
    .limit(1)
    .get();
  return !existing.empty;
}

async function resolveAssignee(companyId: string, assignTo: string | undefined) {
  if (!assignTo) return undefined;
  if (assignTo !== "board_owner") return assignTo;

  const owners = await db
    .collection("users")
    .where("companyId", "==", companyId)
    .where("role", "in", ["owner", "admin"])
    .limit(1)
    .get();
  return owners.docs[0]?.id;
}

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()).replace("Medium", "Normal");
}

function resolveComment(template: string, submission: Submission, hoursWaiting: number) {
  return template
    .replace(/{{\s*submissionId\s*}}/g, submission.trackingCode || submission.id || "submission")
    .replace(/{{\s*hoursWaiting\s*}}/g, String(Math.floor(hoursWaiting)));
}

async function sendBrevoEmails(recipients: string[] | undefined, rule: EscalationRule, submission: Submission) {
  if (!recipients?.length) return;
  const apiKey = process.env.BREVO_API_KEY || functions.config().brevo?.api_key;
  if (!apiKey) {
    functions.logger.warn("Skipping escalation notification emails; BREVO_API_KEY is not configured.");
    return;
  }

  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: { name: "FeedSolve", email: process.env.BREVO_FROM_EMAIL || "hello@feedsolve.com" },
      to: recipients.map((email) => ({ email })),
      subject: `Escalation rule triggered: ${rule.name}`,
      htmlContent: `<p>FeedSolve escalation rule <strong>${rule.name}</strong> triggered for submission <strong>${submission.trackingCode || submission.id}</strong>.</p><p>Subject: ${submission.subject || "Untitled submission"}</p>`,
      textContent: `FeedSolve escalation rule "${rule.name}" triggered for submission ${submission.trackingCode || submission.id}. Subject: ${submission.subject || "Untitled submission"}`,
    },
    { headers: { "api-key": apiKey, "content-type": "application/json" } },
  );
}

async function applyRule(
  companyId: string,
  ruleRef: admin.firestore.DocumentReference,
  rule: EscalationRule,
  submissionRef: admin.firestore.DocumentReference,
  submission: Submission,
  now: admin.firestore.Timestamp,
) {
  const actionsTaken: string[] = [];
  const updates: Record<string, unknown> = { updatedAt: now };
  const assignedTo = await resolveAssignee(companyId, rule.actions.assignTo);
  const hoursWaiting = hoursBetween(triggerStart(submission, rule.trigger.type), now);

  if (rule.actions.changePriority) {
    updates.priority = rule.actions.changePriority;
    actionsTaken.push(`Priority changed to ${titleCase(rule.actions.changePriority)}`);
  }
  if (rule.actions.changeStatus) {
    updates.status = rule.actions.changeStatus;
    actionsTaken.push(`Status changed to ${titleCase(rule.actions.changeStatus)}`);
  }
  if (assignedTo) {
    updates.assignedTo = assignedTo;
    actionsTaken.push(rule.actions.assignTo === "board_owner" ? "Assigned to Board Owner" : "Assigned to teammate");
  }

  if (actionsTaken.length > 0) {
    await submissionRef.update(updates);
  }

  if (rule.actions.addInternalComment?.trim()) {
    const commentRef = submissionRef.collection("internalComments").doc();
    await commentRef.set({
      id: commentRef.id,
      body: resolveComment(rule.actions.addInternalComment, submission, hoursWaiting),
      authorId: "feedsolve_bot",
      authorName: "FeedSolve",
      authorAvatar: null,
      authorType: "system",
      createdAt: now,
      editedAt: null,
      isEdited: false,
      isDeleted: false,
      parentId: null,
    });
    actionsTaken.push("Internal comment added");
  }

  await sendBrevoEmails(rule.actions.notifyEmails, rule, submission);
  if (rule.actions.notifyEmails?.length) {
    actionsTaken.push(`Notified ${rule.actions.notifyEmails.length} teammate${rule.actions.notifyEmails.length === 1 ? "" : "s"}`);
  }

  await submissionRef.collection("escalationLog").add({
    ruleId: rule.id,
    ruleName: rule.name,
    triggeredAt: now,
    actionsTaken,
  });

  await ruleRef.update({
    lastTriggeredAt: now,
    triggerCount: admin.firestore.FieldValue.increment(1),
  });
}

export const evaluateEscalationRules = functions.pubsub
  .schedule("every 15 minutes")
  .timeZone("UTC")
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const activeRulesSnapshot = await db.collectionGroup("escalationRules").where("isActive", "==", true).get();

    functions.logger.info(`Evaluating ${activeRulesSnapshot.size} active escalation rules.`);

    for (const ruleDoc of activeRulesSnapshot.docs) {
      const rule = { id: ruleDoc.id, ...ruleDoc.data() } as EscalationRule;
      const companyRef = ruleDoc.ref.parent.parent;
      if (!companyRef) continue;
      const companyId = companyRef.id;

      let submissionsQuery: admin.firestore.Query = db.collection("submissions").where("companyId", "==", companyId);
      if (rule.conditions.boardId) submissionsQuery = submissionsQuery.where("boardId", "==", rule.conditions.boardId);
      if (rule.conditions.priority?.length === 1) submissionsQuery = submissionsQuery.where("priority", "==", rule.conditions.priority[0]);
      if (rule.conditions.status?.length === 1) submissionsQuery = submissionsQuery.where("status", "==", rule.conditions.status[0]);

      const submissionsSnapshot = await submissionsQuery.limit(500).get();
      for (const submissionDoc of submissionsSnapshot.docs) {
        const submission = { id: submissionDoc.id, ...submissionDoc.data() } as Submission;
        if (!matchesConditions(submission, rule)) continue;

        const elapsedHours = hoursBetween(triggerStart(submission, rule.trigger.type), now);
        if (elapsedHours < rule.trigger.hours) continue;
        if (await alreadyTriggered(submissionDoc.id, ruleDoc.id)) continue;

        await applyRule(companyId, ruleDoc.ref, rule, submissionDoc.ref, submission, now);
      }
    }
  });
