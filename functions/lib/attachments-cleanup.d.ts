import * as functions from 'firebase-functions';
export declare const cleanupOrphanedAttachments: functions.CloudFunction<unknown>;
export declare const scanAttachmentOnUpload: functions.CloudFunction<functions.Change<functions.firestore.QueryDocumentSnapshot>>;
export declare const checkVirusScanResults: functions.CloudFunction<unknown>;
export declare const resetMonthlyStorage: functions.CloudFunction<unknown>;
//# sourceMappingURL=attachments-cleanup.d.ts.map