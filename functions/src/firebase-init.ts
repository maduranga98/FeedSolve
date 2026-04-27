import * as admin from 'firebase-admin';

// Single initialization point — imported first by index.ts so every
// subsequent module that calls admin.firestore() at load time is safe.
if (!admin.apps.length) {
  admin.initializeApp();
}

export { admin };
