import * as functions from 'firebase-functions';
/**
 * Archives submissions older than 24 months by setting status='archived' and
 * moving the document to an `archived_submissions` collection for compliance.
 * Runs daily at 02:00 UTC.
 */
export declare const archiveOldSubmissions: functions.CloudFunction<unknown>;
/**
 * Deletes data for free-tier accounts that have been inactive for 90+ days.
 * "Inactive" means no submission activity and no login in the past 90 days.
 * Runs weekly on Sundays at 03:00 UTC.
 */
export declare const cleanupAbandonedFreeAccounts: functions.CloudFunction<unknown>;
//# sourceMappingURL=data-cleanup.d.ts.map