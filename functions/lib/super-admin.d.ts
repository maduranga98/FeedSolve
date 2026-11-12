import * as functions from "firebase-functions";
/**
 * Platform-wide overview for the FeedSolve operator. Callable only by accounts
 * carrying the `superAdmin` custom claim (see scripts/set-super-admin.mjs).
 * Runs with the Admin SDK so it bypasses tenant-scoped Firestore rules.
 */
export declare const superAdminOverview: functions.HttpsFunction & functions.Runnable<any>;
/**
 * Super admin: create a board inside any company and invite users to that
 * company in one step. Plan limits are intentionally bypassed (operator
 * override). Invitations reuse the regular `teamInvitations` flow, so the
 * existing trigger emails each invitee an accept link.
 */
export declare const superAdminCreateBoard: functions.HttpsFunction & functions.Runnable<any>;
//# sourceMappingURL=super-admin.d.ts.map