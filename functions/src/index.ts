import * as functions from 'firebase-functions';
import app from './api';

export * from './webhooks';
export * from './attachments-cleanup';
export * from './comment-notifications';

export const api = functions.https.onRequest(app);
