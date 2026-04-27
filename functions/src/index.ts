import './firebase-init'; // Must be first: initializes admin before any other module loads
import * as functions from 'firebase-functions';
import app from './api';

export * from './webhooks';
export * from './attachments-cleanup';
export * from './comment-notifications';
export * from './analytics-scheduler';
export * from './data-cleanup';
export * from './stripe-billing';

export const api = functions.https.onRequest(app);
