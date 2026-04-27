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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetMonthlyStorage = exports.checkVirusScanResults = exports.scanAttachmentOnUpload = exports.cleanupOrphanedAttachments = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
const db = admin.firestore();
const bucket = admin.storage().bucket();
const CLEANUP_DAYS = 30;
const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;
// Cleanup orphaned files - runs daily
exports.cleanupOrphanedAttachments = functions.pubsub
    .schedule("every 24 hours")
    .onRun(async () => {
    console.log("Starting attachment cleanup...");
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_DAYS);
        // Find all submissions that were deleted or have old attachments
        const snapshot = await db.collection("submissions").get();
        const validAttachmentPaths = new Set();
        snapshot.forEach((doc) => {
            const submission = doc.data();
            if (submission.attachments && Array.isArray(submission.attachments)) {
                submission.attachments.forEach((attachment) => {
                    validAttachmentPaths.add(attachment.storagePath);
                });
            }
        });
        // List all files in attachments directory
        const [files] = await bucket.getFiles({
            prefix: "attachments/",
        });
        let deletedCount = 0;
        for (const file of files) {
            if (!validAttachmentPaths.has(file.name)) {
                const [metadata] = await file.getMetadata();
                const fileAge = Date.now() - new Date(metadata.timeCreated).getTime();
                // Delete if older than cutoff
                if (fileAge > CLEANUP_DAYS * 24 * 60 * 60 * 1000) {
                    await file.delete();
                    deletedCount++;
                }
            }
        }
        console.log(`Cleanup complete: deleted ${deletedCount} orphaned files`);
        return { deleted: deletedCount };
    }
    catch (error) {
        console.error("Cleanup failed:", error);
        throw error;
    }
});
// Scan uploaded files with VirusTotal
exports.scanAttachmentOnUpload = functions.firestore
    .document("submissions/{submissionId}")
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!VIRUSTOTAL_API_KEY) {
        console.log("VirusTotal API key not configured");
        return;
    }
    try {
        // Find new attachments
        const beforeAttachments = before.attachments || [];
        const afterAttachments = after.attachments || [];
        const newAttachments = afterAttachments.filter((att) => !beforeAttachments.some((batt) => batt.id === att.id) && att.scanStatus === "pending");
        for (const attachment of newAttachments) {
            try {
                // Download file from storage
                const file = bucket.file(attachment.storagePath);
                const [fileContent] = await file.download();
                // Submit to VirusTotal
                const formData = new FormData();
                formData.append("file", new Blob([fileContent]), attachment.filename);
                const response = await axios_1.default.post("https://www.virustotal.com/api/v3/files", formData, {
                    headers: {
                        "x-apikey": VIRUSTOTAL_API_KEY,
                    },
                });
                const analysisId = response.data.data.id;
                const submissionId = context.params.submissionId;
                // Queue analysis check (will run after delay)
                await db.collection("virus_scan_queue").add({
                    submissionId,
                    attachmentId: attachment.id,
                    analysisId,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    status: "pending",
                });
                console.log(`File queued for scanning: ${attachment.filename}`);
            }
            catch (error) {
                console.error(`Failed to scan ${attachment.filename}:`, error);
                // Mark as scan failed
                await markScanStatus(context.params.submissionId, attachment.id, "failed");
            }
        }
    }
    catch (error) {
        console.error("Scan trigger failed:", error);
    }
});
// Check VirusTotal scan results
exports.checkVirusScanResults = functions.pubsub
    .schedule("every 5 minutes")
    .onRun(async () => {
    if (!VIRUSTOTAL_API_KEY)
        return;
    try {
        const scanQueue = await db
            .collection("virus_scan_queue")
            .where("status", "==", "pending")
            .limit(10)
            .get();
        for (const queueDoc of scanQueue.docs) {
            const { submissionId, attachmentId, analysisId } = queueDoc.data();
            try {
                const response = await axios_1.default.get(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
                    headers: {
                        "x-apikey": VIRUSTOTAL_API_KEY,
                    },
                });
                const stats = response.data.data.attributes.stats;
                const isClean = stats.malicious === 0 && stats.suspicious === 0;
                await markScanStatus(submissionId, attachmentId, isClean ? "clean" : "infected");
                await queueDoc.ref.update({
                    status: "completed",
                    result: isClean ? "clean" : "infected",
                    completedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
            catch (error) {
                const err = error;
                if (err.response?.status === 404) {
                    // Analysis not ready yet
                    console.log(`Scan still pending: ${analysisId}`);
                }
                else {
                    console.error(`Failed to check scan result: ${analysisId}`, error);
                    await queueDoc.ref.update({ status: "failed" });
                }
            }
        }
    }
    catch (error) {
        console.error("Scan check failed:", error);
    }
});
async function markScanStatus(submissionId, attachmentId, status) {
    const submissionDoc = await db
        .collection("submissions")
        .doc(submissionId)
        .get();
    if (!submissionDoc.exists)
        return;
    const submission = submissionDoc.data();
    const attachments = submission.attachments || [];
    const updated = attachments.map((att) => att.id === attachmentId
        ? { ...att, scanned: true, scanStatus: status }
        : att);
    await db.collection("submissions").doc(submissionId).update({
        attachments: updated,
    });
}
// Monthly storage reset
exports.resetMonthlyStorage = functions.pubsub
    .schedule("0 0 1 * *") // First day of each month at midnight
    .onRun(async () => {
    try {
        const companiesSnapshot = await db.collection("companies").get();
        for (const companyDoc of companiesSnapshot.docs) {
            await companyDoc.ref.update({
                "usage.storage.usedBytes": 0,
                "usage.storage.lastResetAt": admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        console.log("Monthly storage reset complete");
        return { updated: companiesSnapshot.size };
    }
    catch (error) {
        console.error("Storage reset failed:", error);
        throw error;
    }
});
//# sourceMappingURL=attachments-cleanup.js.map