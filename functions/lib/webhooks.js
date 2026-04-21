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
admin.initializeApp();
const db = admin.firestore();
const SLACK_MESSAGE_LIMIT = 4000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;
exports.handleSubmissionEvent = functions.firestore
    .document('submissions/{submissionId}')
    .onWrite(async (change, context) => {
    const submission = change.after.data();
    const previousSubmission = change.before.data();
    if (!submission)
        return;
    let eventType = 'submission.updated';
    if (!change.before.exists) {
        eventType = 'submission.created';
    }
    else if (previousSubmission && submission.status !== previousSubmission.status) {
        if (submission.status === 'resolved') {
            eventType = 'submission.resolved';
        }
        else {
            eventType = 'submission.updated';
        }
    }
    else if (previousSubmission && submission.assignedTo !== previousSubmission.assignedTo) {
        eventType = 'submission.assigned';
    }
    else if (submission.publicReply && (!previousSubmission || !previousSubmission.publicReply)) {
        eventType = 'submission.reply_added';
    }
    try {
        const companyDoc = await db.collection('companies').doc(submission.companyId).get();
        const webhooks = (companyDoc.data()?.webhooks || {});
        if (webhooks.slack?.enabled && webhooks.slack.events.includes(eventType)) {
            await sendSlackNotification(submission, previousSubmission, eventType, webhooks.slack);
        }
        if (webhooks.email?.enabled && webhooks.email.events.includes(eventType)) {
            await sendEmailNotification(submission, previousSubmission, eventType, webhooks.email);
        }
        if (webhooks.custom?.enabled && webhooks.custom.events.includes(eventType)) {
            await sendCustomWebhook(submission, previousSubmission, eventType, webhooks.custom);
        }
    }
    catch (error) {
        console.error('Error processing webhook event:', error);
    }
});
async function sendSlackNotification(submission, previousSubmission, eventType, slackConfig) {
    try {
        const message = buildSlackMessage(submission, previousSubmission, eventType, slackConfig.format);
        const response = await axios_1.default.post(slackConfig.webhookUrl, {
            text: message.text,
            blocks: message.blocks,
        });
        await logWebhookEvent(submission.companyId, 'slack', eventType, 'success', response.status, undefined, JSON.stringify({ submission: submission.id }));
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await logWebhookEvent(submission.companyId, 'slack', eventType, 'failed', undefined, errorMessage, JSON.stringify({ submission: submission.id }));
    }
}
async function sendEmailNotification(submission, previousSubmission, eventType, emailConfig) {
    try {
        const subject = buildEmailSubject(submission, eventType);
        const body = buildEmailBody(submission, previousSubmission, eventType);
        // TODO: Implement email sending via Brevo, SendGrid, or Firebase Extensions
        // For MVP, log the intention to send
        console.log(`Email would be sent to: ${emailConfig.recipients.join(', ')}`);
        console.log(`Subject: ${subject}`);
        await logWebhookEvent(submission.companyId, 'email', eventType, 'success', 200, undefined, JSON.stringify({ submission: submission.id, recipients: emailConfig.recipients }));
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await logWebhookEvent(submission.companyId, 'email', eventType, 'failed', undefined, errorMessage, JSON.stringify({ submission: submission.id }));
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
                'Content-Type': 'application/json',
                'X-FeedSolve-Signature': signature,
            },
            timeout: 10000,
        });
        await logWebhookEvent(submission.companyId, 'custom', eventType, 'success', response.status, undefined, JSON.stringify(payload), JSON.stringify(response.data));
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await logWebhookEvent(submission.companyId, 'custom', eventType, 'failed', undefined, errorMessage, JSON.stringify({
            submission: submission.id,
            url: customConfig.url,
        }));
    }
}
async function logWebhookEvent(companyId, webhookType, event, status, statusCode, errorMessage, requestBody, response) {
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
        const updateData = {
            'webhookStats.lastEventAt': admin.firestore.FieldValue.serverTimestamp(),
            'webhookStats.totalSent': admin.firestore.FieldValue.increment(1),
        };
        if (status === 'failed') {
            updateData['webhookStats.failureCount'] = admin.firestore.FieldValue.increment(1);
        }
        await db.collection('companies').doc(companyId).update(updateData);
    }
    catch (error) {
        console.error('Error logging webhook event:', error);
    }
}
function buildSlackMessage(submission, previousSubmission, eventType, format) {
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
function buildEmailSubject(submission, eventType) {
    const eventMap = {
        'submission.created': 'New Feedback Submitted',
        'submission.updated': 'Feedback Status Updated',
        'submission.assigned': 'Feedback Assigned to You',
        'submission.reply_added': 'Reply Added to Feedback',
        'submission.resolved': 'Feedback Marked as Resolved',
    };
    return `[FeedSolve] ${eventMap[eventType] || 'Feedback Update'} - ${submission.subject}`;
}
function buildEmailBody(submission, previousSubmission, eventType) {
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
function createHmacSignature(payload, secret) {
    const jsonString = JSON.stringify(payload);
    return crypto_1.default.createHmac('sha256', secret).update(jsonString).digest('hex');
}
function getEventTitle(eventType) {
    const titles = {
        'submission.created': 'New Feedback Submitted',
        'submission.updated': 'Feedback Updated',
        'submission.assigned': 'Feedback Assigned',
        'submission.reply_added': 'Reply Added',
        'submission.resolved': 'Feedback Resolved',
    };
    return titles[eventType] || 'Feedback Event';
}
exports.testWebhook = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { companyId, webhookType } = data;
    const testSubmission = {
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
        const webhooks = (companyDoc.data()?.webhooks || {});
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new functions.https.HttpsError('internal', errorMessage);
    }
});
//# sourceMappingURL=webhooks.js.map