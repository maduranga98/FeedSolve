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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testWebhook = exports.handleSubmissionEvent = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const mailer_1 = require("./mailer");
const email_templates_1 = require("./email-templates");
const notification_settings_1 = require("./notification-settings");
const db = admin.firestore();
const MAX_RETRIES = 3;
exports.handleSubmissionEvent = functions.firestore
    .document("submissions/{submissionId}")
    .onWrite(async (change) => {
    const submission = change.after.data();
    const previousSubmission = change.before.data();
    if (!submission)
        return;
    // Submission documents do not store their own id; take it from the trigger
    // so links and log payloads point at the real document.
    submission.id = change.after.id;
    let eventType = "submission.updated";
    if (!change.before.exists) {
        eventType = "submission.created";
    }
    else if (previousSubmission &&
        submission.status !== previousSubmission.status) {
        if (submission.status === "resolved") {
            eventType = "submission.resolved";
        }
        else {
            eventType = "submission.updated";
        }
    }
    else if (previousSubmission &&
        submission.assignedTo !== previousSubmission.assignedTo) {
        eventType = "submission.assigned";
    }
    else if (submission.publicReply &&
        (!previousSubmission || !previousSubmission.publicReply)) {
        eventType = "submission.reply_added";
    }
    try {
        const webhooks = (await (0, notification_settings_1.getNotificationSettings)(submission.companyId));
        if (webhooks.slack?.enabled &&
            webhooks.slack.events.includes(eventType)) {
            await sendSlackNotification(submission, previousSubmission, eventType, webhooks.slack);
        }
        if ((0, notification_settings_1.emailWantsEvent)(webhooks, eventType)) {
            await deliverEmailNotification(submission, eventType, webhooks);
        }
        if (webhooks.custom?.enabled &&
            webhooks.custom.events.includes(eventType)) {
            await sendCustomWebhook(submission, previousSubmission, eventType, webhooks.custom);
        }
    }
    catch (error) {
        console.error("Error processing webhook event:", error);
    }
});
async function sendSlackNotification(submission, previousSubmission, eventType, slackConfig) {
    try {
        const message = buildSlackMessage(submission, previousSubmission, eventType, slackConfig.format);
        const response = await axios_1.default.post(slackConfig.webhookUrl, {
            text: message.text,
            blocks: message.blocks,
        });
        await logWebhookEvent(submission.companyId, "slack", eventType, "success", response.status, undefined, JSON.stringify({ submission: submission.id }));
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await logWebhookEvent(submission.companyId, "slack", eventType, "failed", undefined, errorMessage, JSON.stringify({ submission: submission.id }));
    }
}
/** Board name for email context; never fails the notification. */
async function getBoardName(boardId) {
    if (!boardId)
        return undefined;
    try {
        const boardDoc = await db.collection("boards").doc(boardId).get();
        return boardDoc.data()?.name || undefined;
    }
    catch {
        return undefined;
    }
}
function toEmailData(submission, boardName) {
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
async function deliverEmailNotification(submission, eventType, settings) {
    const recipients = (0, notification_settings_1.resolveRecipients)(settings, submission.boardId);
    if (!recipients.length)
        return;
    const frequency = settings.email?.frequency || "instant";
    const boardName = await getBoardName(submission.boardId);
    if (frequency === "instant") {
        await sendEmailNotification(submission, eventType, recipients, boardName);
        return;
    }
    await queueDigestEvent(submission, eventType, recipients, frequency, boardName);
}
/** Store an event for the next digest run instead of emailing immediately. */
async function queueDigestEvent(submission, eventType, recipients, frequency, boardName) {
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
        await logWebhookEvent(submission.companyId, "email", eventType, "queued", 202, undefined, JSON.stringify({ submission: submission.id, frequency, recipients: recipients.length }));
    }
    catch (error) {
        functions.logger.error("Failed to queue digest event", { error });
    }
}
async function sendEmailNotification(submission, eventType, recipients, boardName) {
    const base = (0, mailer_1.appUrl)();
    const email = (0, email_templates_1.renderSubmissionAlertEmail)({
        eventType,
        submission: toEmailData(submission, boardName),
        submissionUrl: `${base}/submission/${submission.id}`,
        settingsUrl: `${base}/notifications`,
    });
    try {
        const sent = await (0, mailer_1.sendMail)({
            to: recipients,
            subject: email.subject,
            html: email.html,
            text: email.text,
        });
        if (!sent)
            return;
        await logWebhookEvent(submission.companyId, "email", eventType, "success", 250, undefined, JSON.stringify({ submission: submission.id, recipients: recipients.length }));
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await logWebhookEvent(submission.companyId, "email", eventType, "failed", undefined, errorMessage, JSON.stringify({ submission: submission.id }));
    }
}
async function sendCustomWebhook(submission, previousSubmission, eventType, customConfig) {
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
        const response = await axios_1.default.post(customConfig.url, payload, {
            headers: {
                "Content-Type": "application/json",
                "X-FeedSolve-Signature": signature,
            },
            timeout: 10000,
        });
        await logWebhookEvent(submission.companyId, "custom", eventType, "success", response.status, undefined, JSON.stringify(payload), JSON.stringify(response.data));
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await logWebhookEvent(submission.companyId, "custom", eventType, "failed", undefined, errorMessage, JSON.stringify({
            submission: submission.id,
            url: customConfig.url,
        }));
    }
}
async function logWebhookEvent(companyId, webhookType, event, status, statusCode, errorMessage, requestBody, response) {
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
        const updateData = {
            "webhookStats.lastEventAt": admin.firestore.FieldValue.serverTimestamp(),
            "webhookStats.totalSent": admin.firestore.FieldValue.increment(1),
        };
        if (status === "failed") {
            updateData["webhookStats.failureCount"] =
                admin.firestore.FieldValue.increment(1);
        }
        await db.collection("companies").doc(companyId).update(updateData);
    }
    catch (error) {
        console.error("Error logging webhook event:", error);
    }
}
function buildSlackMessage(submission, previousSubmission, eventType, format) {
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
function createHmacSignature(payload, secret) {
    const jsonString = JSON.stringify(payload);
    return crypto_1.default.createHmac("sha256", secret).update(jsonString).digest("hex");
}
function getEventTitle(eventType) {
    const titles = {
        "submission.created": "New Feedback Submitted",
        "submission.updated": "Feedback Updated",
        "submission.assigned": "Feedback Assigned",
        "submission.reply_added": "Reply Added",
        "submission.resolved": "Feedback Resolved",
    };
    return titles[eventType] || "Feedback Event";
}
exports.testWebhook = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }
    const { companyId, webhookType, boardId } = data;
    if (!companyId || !webhookType) {
        throw new functions.https.HttpsError("invalid-argument", "companyId and webhookType are required");
    }
    // Only owners/admins of that company may fire test notifications.
    const callerDoc = await db.collection("users").doc(context.auth.uid).get();
    const caller = callerDoc.data();
    const callerRole = caller?.role?.toLowerCase();
    if (caller?.companyId !== companyId ||
        !["owner", "admin"].includes(callerRole || "")) {
        throw new functions.https.HttpsError("permission-denied", "You do not have permission to test this company's notifications");
    }
    const testSubmission = {
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
        const webhooks = (await (0, notification_settings_1.getNotificationSettings)(companyId));
        if (webhookType === "slack" && webhooks.slack?.enabled) {
            await sendSlackNotification(testSubmission, undefined, "submission.created", webhooks.slack);
            return { success: true, message: "Test Slack message sent" };
        }
        if (webhookType === "email" && webhooks.email?.enabled) {
            const recipients = (0, notification_settings_1.resolveRecipients)(webhooks, testSubmission.boardId);
            if (!recipients.length) {
                throw new functions.https.HttpsError("failed-precondition", "Add at least one recipient before sending a test email");
            }
            // A test always sends immediately, even on a digest schedule.
            await sendEmailNotification(testSubmission, "submission.created", recipients);
            return {
                success: true,
                message: `Test email sent to ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}`,
            };
        }
        if (webhookType === "custom" && webhooks.custom?.enabled) {
            await sendCustomWebhook(testSubmission, undefined, "submission.created", webhooks.custom);
            return { success: true, message: "Test custom webhook sent" };
        }
        throw new functions.https.HttpsError("invalid-argument", "Webhook not found or not enabled");
    }
    catch (error) {
        if (error instanceof functions.https.HttpsError)
            throw error;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        throw new functions.https.HttpsError("internal", errorMessage);
    }
});
//# sourceMappingURL=webhooks.js.map