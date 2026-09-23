"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateEscalationRules = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const mailer_1 = require("./mailer");
const db = admin.firestore();
function hoursBetween(start, end) {
    if (!start)
        return 0;
    return (end.toMillis() - start.toMillis()) / (1000 * 60 * 60);
}
function triggerStart(submission, type) {
    if (type === "time_since_created")
        return submission.createdAt;
    if (type === "time_since_status_change")
        return submission.updatedAt ?? submission.createdAt;
    return submission.createdAt;
}
function matchesConditions(submission, rule) {
    const { conditions } = rule;
    if (conditions.boardId && submission.boardId !== conditions.boardId)
        return false;
    if (conditions.priority?.length && !conditions.priority.includes(submission.priority ?? ""))
        return false;
    if (conditions.status?.length && !conditions.status.includes(submission.status ?? ""))
        return false;
    if ((conditions.isUnassigned || rule.trigger.type === "time_unassigned") && submission.assignedTo)
        return false;
    return true;
}
async function alreadyTriggered(submissionId, ruleId) {
    const existing = await db
        .collection("submissions")
        .doc(submissionId)
        .collection("escalationLog")
        .where("ruleId", "==", ruleId)
        .limit(1)
        .get();
    return !existing.empty;
}
async function resolveAssignee(companyId, assignTo) {
    if (!assignTo)
        return undefined;
    if (assignTo !== "board_owner")
        return assignTo;
    const owners = await db
        .collection("users")
        .where("companyId", "==", companyId)
        .where("role", "in", ["owner", "admin"])
        .limit(1)
        .get();
    return owners.docs[0]?.id;
}
function titleCase(value) {
    return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
function resolveComment(template, submission, hoursWaiting) {
    return template
        .replace(/{{\s*submissionId\s*}}/g, submission.trackingCode || submission.id || "submission")
        .replace(/{{\s*hoursWaiting\s*}}/g, String(Math.floor(hoursWaiting)));
}
async function sendEscalationEmails(recipients, rule, submission) {
    if (!recipients?.length)
        return;
    const trackingRef = submission.trackingCode || submission.id || "submission";
    const subject = submission.subject || "Untitled submission";
    try {
        await (0, mailer_1.sendMail)({
            to: recipients,
            subject: `Escalation rule triggered: ${rule.name}`,
            text: `FeedSolve escalation rule "${rule.name}" triggered for submission ${trackingRef}.\n` +
                `Subject: ${subject}`,
            html: `<p>FeedSolve escalation rule <strong>${rule.name}</strong> triggered for submission ` +
                `<strong>${trackingRef}</strong>.</p><p>Subject: ${subject}</p>`,
        });
    }
    catch (error) {
        functions.logger.warn("Failed to send escalation notification email", { error, ruleId: rule.id });
    }
}
async function applyRule(companyId, ruleRef, rule, submissionRef, submission, now) {
    const actionsTaken = [];
    const updates = { updatedAt: now };
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
    await sendEscalationEmails(rule.actions.notifyEmails, rule, submission);
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
exports.evaluateEscalationRules = functions
    .runWith({ secrets: ["SMTP_PASS"] })
    .pubsub.schedule("every 15 minutes")
    .timeZone("UTC")
    .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const activeRulesSnapshot = await db.collectionGroup("escalationRules").where("isActive", "==", true).get();
    functions.logger.info(`Evaluating ${activeRulesSnapshot.size} active escalation rules.`);
    for (const ruleDoc of activeRulesSnapshot.docs) {
        const rule = { id: ruleDoc.id, ...ruleDoc.data() };
        const companyRef = ruleDoc.ref.parent.parent;
        if (!companyRef)
            continue;
        const companyId = companyRef.id;
        let submissionsQuery = db.collection("submissions").where("companyId", "==", companyId);
        if (rule.conditions.boardId)
            submissionsQuery = submissionsQuery.where("boardId", "==", rule.conditions.boardId);
        if (rule.conditions.priority?.length === 1)
            submissionsQuery = submissionsQuery.where("priority", "==", rule.conditions.priority[0]);
        if (rule.conditions.status?.length === 1)
            submissionsQuery = submissionsQuery.where("status", "==", rule.conditions.status[0]);
        const submissionsSnapshot = await submissionsQuery.limit(500).get();
        for (const submissionDoc of submissionsSnapshot.docs) {
            const submission = { id: submissionDoc.id, ...submissionDoc.data() };
            if (!matchesConditions(submission, rule))
                continue;
            const elapsedHours = hoursBetween(triggerStart(submission, rule.trigger.type), now);
            if (elapsedHours < rule.trigger.hours)
                continue;
            if (await alreadyTriggered(submissionDoc.id, ruleDoc.id))
                continue;
            await applyRule(companyId, ruleDoc.ref, rule, submissionDoc.ref, submission, now);
        }
    }
});
//# sourceMappingURL=evaluateEscalationRules.js.map