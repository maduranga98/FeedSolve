"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalyticsSnapshot = exports.computeAnalyticsSnapshots = void 0;
const functions = __importStar(require("firebase-functions"));
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("firebase-admin/auth");
exports.computeAnalyticsSnapshots = functions.pubsub
    .schedule('every 24 hours')
    .timeZone('UTC')
    .onRun(async (context) => {
    const db = (0, firestore_1.getFirestore)();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    try {
        const companiesSnapshot = await db.collection('companies').get();
        for (const companyDoc of companiesSnapshot.docs) {
            const companyId = companyDoc.id;
            console.log(`Computing analytics for company: ${companyId}`);
            const submissionsSnapshot = await db
                .collection('companies')
                .doc(companyId)
                .collection('submissions')
                .get();
            const submissions = submissionsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            // Calculate metrics
            const metrics = calculateMetrics(submissions);
            // Store analytics snapshot
            await db
                .collection('companies')
                .doc(companyId)
                .collection('analyticsSnapshots')
                .doc(today.toISOString().split('T')[0])
                .set({
                ...metrics,
                date: today,
                createdAt: new Date(),
            });
            console.log(`Analytics snapshot created for company: ${companyId}`);
        }
        console.log('Analytics computation completed successfully');
        return;
    }
    catch (error) {
        console.error('Error computing analytics snapshots:', error);
        throw error;
    }
});
function calculateMetrics(submissions) {
    const total = submissions.length;
    const resolved = submissions.filter((s) => s.status === 'resolved').length;
    const resolutionRate = total > 0 ? (resolved / total) * 100 : 0;
    // Calculate average resolution time
    const resolvedWithTime = submissions
        .filter((s) => s.status === 'resolved' && s.resolvedAt)
        .map((s) => {
        const created = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
        const resolved = s.resolvedAt?.toDate ? s.resolvedAt.toDate() : new Date(s.resolvedAt);
        return Math.floor((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    });
    const averageResolutionTime = resolvedWithTime.length > 0
        ? resolvedWithTime.reduce((a, b) => a + b, 0) / resolvedWithTime.length
        : 0;
    // Count by status
    const byStatus = {};
    submissions.forEach((s) => {
        byStatus[s.status] = (byStatus[s.status] || 0) + 1;
    });
    // Count by priority
    const byPriority = {};
    submissions.forEach((s) => {
        byPriority[s.priority] = (byPriority[s.priority] || 0) + 1;
    });
    // Count by category
    const byCategory = {};
    submissions.forEach((s) => {
        byCategory[s.category] = (byCategory[s.category] || 0) + 1;
    });
    // Count by board
    const byBoard = {};
    submissions.forEach((s) => {
        byBoard[s.boardId] = (byBoard[s.boardId] || 0) + 1;
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
exports.getAnalyticsSnapshot = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const db = (0, firestore_1.getFirestore)();
    const { date } = data;
    try {
        const user = await (0, auth_1.getAuth)().getUser(context.auth.uid);
        const userDoc = await db.collection('users').doc(user.uid).get();
        const companyId = userDoc.get('companyId');
        if (!companyId) {
            throw new functions.https.HttpsError('failed-precondition', 'Company not found');
        }
        const snapshot = await db
            .collection('companies')
            .doc(companyId)
            .collection('analyticsSnapshots')
            .doc(date)
            .get();
        if (!snapshot.exists) {
            throw new functions.https.HttpsError('not-found', 'Analytics snapshot not found');
        }
        return snapshot.data();
    }
    catch (error) {
        console.error('Error fetching analytics snapshot:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Internal error');
    }
});
//# sourceMappingURL=analytics-scheduler.js.map