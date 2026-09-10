/**
 * Emails sent to the person who submitted the feedback:
 *  - a receipt when the submission is created
 *  - a follow-up when a public reply is added or the submission is resolved
 *
 * Both are controlled per company from Settings → Notifications and default to on.
 */
import * as functions from "firebase-functions";
export declare const notifySubmitter: functions.CloudFunction<functions.Change<functions.firestore.DocumentSnapshot>>;
//# sourceMappingURL=submitter-notifications.d.ts.map