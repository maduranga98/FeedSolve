import * as functions from 'firebase-functions';
import app from './api';

export * from './webhooks';

export const api = functions.https.onRequest(app);
