import * as functions from 'firebase-functions';
export declare const onCommentCreated: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
export declare const onCommentUpdated: functions.CloudFunction<functions.Change<functions.firestore.QueryDocumentSnapshot>>;
export declare const onCommentDeleted: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
export declare const clearOldNotifications: functions.CloudFunction<unknown>;
//# sourceMappingURL=comment-notifications.d.ts.map