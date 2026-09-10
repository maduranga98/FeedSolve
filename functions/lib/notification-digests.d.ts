/**
 * Daily and weekly digests for companies whose email notification frequency is
 * not "instant". Events are queued by the submission webhook trigger into
 * `notification_digests/{companyId}/events` and drained here.
 */
import * as functions from "firebase-functions";
/** Every day at 08:00 UTC. */
export declare const sendDailyDigests: functions.CloudFunction<unknown>;
/** Mondays at 08:00 UTC. */
export declare const sendWeeklyDigests: functions.CloudFunction<unknown>;
//# sourceMappingURL=notification-digests.d.ts.map