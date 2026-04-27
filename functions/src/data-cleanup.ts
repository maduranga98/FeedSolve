import * as functions from 'firebase-functions';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const BATCH_SIZE = 400;

function log(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>) {
  console[level](JSON.stringify({ severity: level.toUpperCase(), message, ...data }));
}

/**
 * Archives submissions older than 24 months by setting status='archived' and
 * moving the document to an `archived_submissions` collection for compliance.
 * Runs daily at 02:00 UTC.
 */
export const archiveOldSubmissions = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const db = getFirestore();
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 24);
    const cutoffTimestamp = Timestamp.fromDate(cutoff);

    log('info', 'Starting archiveOldSubmissions', { cutoff: cutoff.toISOString() });

    let totalArchived = 0;
    let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | undefined;

    while (true) {
      let q = db
        .collection('submissions')
        .where('createdAt', '<', cutoffTimestamp)
        .where('status', 'not-in', ['archived'])
        .orderBy('createdAt')
        .limit(BATCH_SIZE);

      if (lastDoc) {
        q = q.startAfter(lastDoc);
      }

      const snapshot = await q.get();
      if (snapshot.empty) break;

      const batch = db.batch();

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // Copy to archived_submissions (retain full data for compliance)
        const archiveRef = db.collection('archived_submissions').doc(docSnap.id);
        batch.set(archiveRef, {
          ...data,
          archivedAt: Timestamp.now(),
          archiveReason: 'retention_24_months',
        });

        // Remove PII from the live submission and mark as archived
        batch.update(docSnap.ref, {
          status: 'archived',
          submitterEmail: null,
          submitterName: null,
          submitterMobile: null,
          updatedAt: Timestamp.now(),
        });
      }

      await batch.commit();

      totalArchived += snapshot.size;
      lastDoc = snapshot.docs[snapshot.docs.length - 1];

      log('info', 'Archived batch', { count: snapshot.size, totalArchived });

      if (snapshot.size < BATCH_SIZE) break;
    }

    log('info', 'archiveOldSubmissions complete', { totalArchived });
  });

/**
 * Deletes data for free-tier accounts that have been inactive for 90+ days.
 * "Inactive" means no submission activity and no login in the past 90 days.
 * Runs weekly on Sundays at 03:00 UTC.
 */
export const cleanupAbandonedFreeAccounts = functions.pubsub
  .schedule('0 3 * * 0')
  .timeZone('UTC')
  .onRun(async () => {
    const db = getFirestore();
    const auth = getAuth();

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffTimestamp = Timestamp.fromDate(cutoff);

    log('info', 'Starting cleanupAbandonedFreeAccounts', { cutoff: cutoff.toISOString() });

    let totalCleaned = 0;

    // Find free-tier companies created more than 90 days ago
    const companiesSnap = await db
      .collection('companies')
      .where('subscription.tier', '==', 'free')
      .where('createdAt', '<', cutoffTimestamp)
      .get();

    for (const companyDoc of companiesSnap.docs) {
      const companyId = companyDoc.id;
      const companyData = companyDoc.data();

      // Skip if there has been any submission activity recently
      const recentSubmissions = await db
        .collection('submissions')
        .where('companyId', '==', companyId)
        .where('createdAt', '>=', cutoffTimestamp)
        .limit(1)
        .get();

      if (!recentSubmissions.empty) continue;

      // Check Firebase Auth last sign-in for any user in this company
      const usersSnap = await db
        .collection('users')
        .where('companyId', '==', companyId)
        .get();

      let hasRecentLogin = false;
      for (const userDoc of usersSnap.docs) {
        try {
          const authUser = await auth.getUser(userDoc.id);
          const lastSignIn = authUser.metadata.lastSignInTime
            ? new Date(authUser.metadata.lastSignInTime)
            : null;
          if (lastSignIn && lastSignIn >= cutoff) {
            hasRecentLogin = true;
            break;
          }
        } catch {
          // User may have been deleted from Auth already
        }
      }

      if (hasRecentLogin) continue;

      // Mark company as abandoned (soft-delete — hard delete requires ops review)
      await companyDoc.ref.update({
        status: 'abandoned',
        abandonedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      log('info', 'Marked company as abandoned', {
        companyId,
        companyName: companyData.name,
        createdAt: companyData.createdAt?.toDate?.()?.toISOString(),
      });

      totalCleaned++;
    }

    log('info', 'cleanupAbandonedFreeAccounts complete', { totalCleaned });
  });
