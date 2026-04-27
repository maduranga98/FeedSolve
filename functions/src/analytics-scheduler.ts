import * as functions from "firebase-functions";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

export const computeAnalyticsSnapshots = functions.pubsub
  .schedule("every 24 hours")
  .timeZone("UTC")
  .onRun(async () => {
    const db = getFirestore();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const companiesSnapshot = await db.collection("companies").get();

      for (const companyDoc of companiesSnapshot.docs) {
        const companyId = companyDoc.id;
        console.log(`Computing analytics for company: ${companyId}`);

        const submissionsSnapshot = await db
          .collection("companies")
          .doc(companyId)
          .collection("submissions")
          .get();

        const submissions = submissionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Calculate metrics
        const metrics = calculateMetrics(submissions);

        // Store analytics snapshot
        await db
          .collection("companies")
          .doc(companyId)
          .collection("analyticsSnapshots")
          .doc(today.toISOString().split("T")[0])
          .set({
            ...metrics,
            date: today,
            createdAt: new Date(),
          });

        console.log(`Analytics snapshot created for company: ${companyId}`);
      }

      console.log("Analytics computation completed successfully");
      return;
    } catch (error) {
      console.error("Error computing analytics snapshots:", error);
      throw error;
    }
  });

interface Submission {
  id: string;
  status?: string;
  priority?: string;
  category?: string;
  boardId?: string;
  createdAt?: unknown;
  resolvedAt?: unknown;
}

function calculateMetrics(submissions: Submission[]) {
  const total = submissions.length;
  const resolved = submissions.filter((s) => s.status === "resolved").length;
  const resolutionRate = total > 0 ? (resolved / total) * 100 : 0;

  // Calculate average resolution time
  const resolvedWithTime = submissions
    .filter((s) => s.status === "resolved" && s.resolvedAt)
    .map((s) => {
      const created = (s.createdAt as any)?.toDate
        ? (s.createdAt as any).toDate()
        : new Date(s.createdAt as unknown as string);
      const resolved = (s.resolvedAt as any)?.toDate
        ? (s.resolvedAt as any).toDate()
        : new Date(s.resolvedAt as unknown as string);
      return Math.floor(
        (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
      );
    });

  const averageResolutionTime =
    resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((a, b) => a + b, 0) / resolvedWithTime.length
      : 0;

  // Count by status
  const byStatus: Record<string, number> = {};
  submissions.forEach((s) => {
    if (s.status) byStatus[s.status] = (byStatus[s.status] || 0) + 1;
  });

  // Count by priority
  const byPriority: Record<string, number> = {};
  submissions.forEach((s) => {
    if (s.priority) byPriority[s.priority] = (byPriority[s.priority] || 0) + 1;
  });

  // Count by category
  const byCategory: Record<string, number> = {};
  submissions.forEach((s) => {
    if (s.category) byCategory[s.category] = (byCategory[s.category] || 0) + 1;
  });

  // Count by board
  const byBoard: Record<string, number> = {};
  submissions.forEach((s) => {
    if (s.boardId) byBoard[s.boardId] = (byBoard[s.boardId] || 0) + 1;
  });

  return {
    totalSubmissions: total,
    resolvedSubmissions: resolved,
    resolutionRate,
    averageResolutionTime,
    submissionsByStatus: byStatus,
    submissionsByPriority: byPriority,
    submissionsByCategory: byCategory,
    submissionsByBoard: byBoard,
  };
}

export const getAnalyticsSnapshot = functions.https.onCall(
  async (data, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Authentication required",
      );
    }

    const db = getFirestore();
    const { date } = data;

    try {
      const user = await getAuth().getUser(context.auth.uid);
      const userDoc = await db.collection("users").doc(user.uid).get();
      const companyId = userDoc.get("companyId");

      if (!companyId) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Company not found",
        );
      }

      const snapshot = await db
        .collection("companies")
        .doc(companyId)
        .collection("analyticsSnapshots")
        .doc(date)
        .get();

      if (!snapshot.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Analytics snapshot not found",
        );
      }

      return snapshot.data();
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      console.error("Error fetching analytics snapshot:", err);
      throw new functions.https.HttpsError(
        "internal",
        ((err as Record<string, unknown>).message as string) ||
          "Internal error",
      );
    }
  },
);
