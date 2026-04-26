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
exports.clearOldNotifications = exports.onCommentDeleted = exports.onCommentUpdated = exports.onCommentCreated = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
// Trigger when a comment is created
exports.onCommentCreated = functions.firestore
    .document('submissions/{submissionId}/comments/{commentId}')
    .onCreate(async (snap, context) => {
    const comment = snap.data();
    const { submissionId, companyId } = context.params;
    try {
        // Get submission details
        const submissionRef = db.collection('submissions').doc(submissionId);
        const submissionSnap = await submissionRef.get();
        if (!submissionSnap.exists) {
            console.log('Submission not found:', submissionId);
            return;
        }
        const submission = submissionSnap.data();
        const mentionedUserIds = comment.mentions;
        // Create notifications for each mentioned user
        if (mentionedUserIds.length > 0) {
            const batch = db.batch();
            const notificationsRef = db.collection('companies').doc(companyId).collection('notifications');
            for (const userId of mentionedUserIds) {
                const notificationRef = notificationsRef.doc();
                batch.set(notificationRef, {
                    companyId,
                    userId,
                    mentionedBy: comment.author.id,
                    submissionId,
                    commentId: snap.id,
                    isRead: false,
                    createdAt: admin.firestore.Timestamp.now(),
                    type: 'mention',
                });
            }
            await batch.commit();
            console.log(`Created notifications for ${mentionedUserIds.length} users`);
        }
        // Update submission comment count
        const commentCountSnap = await submissionRef
            .collection('comments')
            .get();
        await submissionRef.update({
            commentCount: commentCountSnap.size,
            lastCommentAt: admin.firestore.Timestamp.now(),
        });
        console.log('Comment created successfully:', snap.id);
    }
    catch (error) {
        console.error('Error handling comment creation:', error);
        throw error;
    }
});
// Trigger when a comment is updated (for reactions and edits)
exports.onCommentUpdated = functions.firestore
    .document('submissions/{submissionId}/comments/{commentId}')
    .onUpdate(async (change, context) => {
    const oldComment = change.before.data();
    const newComment = change.after.data();
    const { submissionId, companyId } = context.params;
    try {
        // Check if reactions were added
        const oldReactions = oldComment.reactions || [];
        const newReactions = newComment.reactions || [];
        if (oldReactions.length !== newReactions.length) {
            console.log('Reaction updated on comment:', context.params.commentId);
        }
        // Check if content was edited
        if (oldComment.content !== newComment.content) {
            console.log('Comment edited:', context.params.commentId);
            // Could add audit logging here
            const auditRef = db.collection('companies').doc(companyId).collection('audit_logs').doc();
            await auditRef.set({
                action: 'comment_edited',
                userId: oldComment.author.id,
                submissionId,
                commentId: context.params.commentId,
                timestamp: admin.firestore.Timestamp.now(),
            });
        }
    }
    catch (error) {
        console.error('Error handling comment update:', error);
        throw error;
    }
});
// Trigger when a comment is deleted
exports.onCommentDeleted = functions.firestore
    .document('submissions/{submissionId}/comments/{commentId}')
    .onDelete(async (snap, context) => {
    const comment = snap.data();
    const { submissionId, companyId } = context.params;
    try {
        // Update submission comment count
        const submissionRef = db.collection('submissions').doc(submissionId);
        const commentCountSnap = await submissionRef.collection('comments').get();
        await submissionRef.update({
            commentCount: commentCountSnap.size,
        });
        // Log deletion
        const auditRef = db.collection('companies').doc(companyId).collection('audit_logs').doc();
        await auditRef.set({
            action: 'comment_deleted',
            userId: comment.author.id,
            submissionId,
            commentId: context.params.commentId,
            timestamp: admin.firestore.Timestamp.now(),
        });
        console.log('Comment deleted:', context.params.commentId);
    }
    catch (error) {
        console.error('Error handling comment deletion:', error);
        throw error;
    }
});
// Clear old notifications (older than 30 days)
exports.clearOldNotifications = functions.pubsub
    .schedule('every 7 days')
    .onRun(async (context) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    try {
        const companiesSnap = await db.collection('companies').get();
        for (const companyDoc of companiesSnap.docs) {
            const notificationsSnap = await companyDoc.ref
                .collection('notifications')
                .where('createdAt', '<', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
                .get();
            const batch = db.batch();
            for (const notifDoc of notificationsSnap.docs) {
                batch.delete(notifDoc.ref);
            }
            if (notificationsSnap.size > 0) {
                await batch.commit();
                console.log(`Deleted ${notificationsSnap.size} old notifications from company ${companyDoc.id}`);
            }
        }
        console.log('Old notifications cleanup completed');
    }
    catch (error) {
        console.error('Error cleaning up old notifications:', error);
        throw error;
    }
});
//# sourceMappingURL=comment-notifications.js.map