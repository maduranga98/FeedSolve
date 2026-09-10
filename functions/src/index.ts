import './firebase-init'; // Must be first: initializes admin before any other module loads
import * as functions from 'firebase-functions';
import app from './api';

export * from './submission-notifications';
export * from './attachments-cleanup';
export * from './comment-notifications';
export * from './analytics-scheduler';
export * from './data-cleanup';
export * from './stripe-billing';
export * from './team-invitations';
export * from './evaluateEscalationRules';
export * from './rotateBoardCycles';
export * from './onSubmissionCreate';
export * from './submitter-notifications';
export * from './notification-digests';

export const api = functions.https.onRequest(app);
