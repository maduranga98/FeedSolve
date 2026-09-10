/**
 * Team email notifications for submission activity.
 *
 * Recipients come from the roles and addresses configured at Settings →
 * Notifications; delivery is either instant or queued for the daily/weekly
 * digest. Every attempt is recorded in `notification_logs/{companyId}/logs`.
 */
import * as functions from "firebase-functions";
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
export declare function sendNotificationEmail(submission: Submission, eventType: string, recipients: string[], boardName?: string): Promise<void>;
export declare const onSubmissionNotification: functions.CloudFunction<functions.Change<functions.firestore.DocumentSnapshot>>;
/** Send a sample notification to the configured recipients (owner/admin only). */
export declare const sendTestNotification: functions.HttpsFunction & functions.Runnable<any>;
//# sourceMappingURL=submission-notifications.d.ts.map