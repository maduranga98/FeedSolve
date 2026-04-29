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
const admin = __importStar(require("firebase-admin"));
const express_1 = require("express");
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
const db = admin.firestore();
const bucket = admin.storage().bucket();
const ATTACHMENT_CONFIG = {
    maxFileSize: 5 * 1024 * 1024, // 5MB per file
    maxSubmissionSize: 20 * 1024 * 1024, // 20MB per submission
    allowedFileTypes: ["jpg", "jpeg", "png", "pdf", "doc", "docx", "xlsx"],
    tierLimits: {
        free: 5 * 1024 * 1024,
        starter: 50 * 1024 * 1024,
        growth: 500 * 1024 * 1024,
        business: 5 * 1024 * 1024 * 1024,
    },
};
function getFileExtension(filename) {
    return filename.split(".").pop()?.toLowerCase() || "";
}
function isValidFileType(filename) {
    const ext = getFileExtension(filename);
    return ATTACHMENT_CONFIG.allowedFileTypes.includes(ext);
}
async function checkStorageQuota(companyId, additionalBytes) {
    const companyDoc = await db.collection("companies").doc(companyId).get();
    if (!companyDoc.exists)
        return false;
    const company = companyDoc.data();
    const tier = company?.subscription?.tier || "free";
    const limit = ATTACHMENT_CONFIG.tierLimits[tier];
    const usage = company?.usage?.storage?.usedBytes || 0;
    return usage + additionalBytes <= limit;
}
async function updateStorageUsage(companyId, bytes) {
    await db
        .collection("companies")
        .doc(companyId)
        .update({
        "usage.storage.usedBytes": admin.firestore.FieldValue.increment(bytes),
        "usage.storage.lastResetAt": admin.firestore.FieldValue.serverTimestamp(),
    });
}
// Public endpoint for unauthenticated form submissions (no API key required)
// This route is mounted before the authenticateApiKey middleware in api.ts
router.post("/public/submissions/:submissionId/attachments", async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { filename, filetype, filesize, base64data } = req.body;
        if (!submissionId || !filename || !filetype || !filesize || !base64data) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }
        if (!isValidFileType(filename)) {
            res.status(400).json({ error: "File type not allowed" });
            return;
        }
        if (filesize > ATTACHMENT_CONFIG.maxFileSize) {
            res.status(400).json({ error: "File exceeds max size" });
            return;
        }
        const submissionDoc = await db
            .collection("submissions")
            .doc(submissionId)
            .get();
        if (!submissionDoc.exists) {
            res.status(404).json({ error: "Submission not found" });
            return;
        }
        const submission = submissionDoc.data();
        const { companyId } = submission;
        // Only allow uploads for very recent submissions (within 2 hours)
        const createdAt = submission.createdAt?.toDate?.() || new Date(0);
        if (Date.now() - createdAt.getTime() > 2 * 60 * 60 * 1000) {
            res.status(403).json({ error: "Submission too old for attachments" });
            return;
        }
        const hasQuota = await checkStorageQuota(companyId, filesize);
        if (!hasQuota) {
            res.status(402).json({ error: "Storage quota exceeded" });
            return;
        }
        const submissionAttachments = submission.attachments || [];
        const submissionSize = submissionAttachments.reduce((sum, att) => sum + att.fileSize, 0);
        if (submissionSize + filesize > ATTACHMENT_CONFIG.maxSubmissionSize) {
            res.status(400).json({ error: "Submission size limit exceeded" });
            return;
        }
        const attachmentId = (0, uuid_1.v4)();
        const storagePath = `attachments/${companyId}/${submissionId}/${attachmentId}`;
        const file = bucket.file(storagePath);
        const buffer = Buffer.from(base64data, "base64");
        await file.save(buffer, { contentType: filetype });
        const attachment = {
            id: attachmentId,
            filename,
            fileType: filetype,
            fileSize: filesize,
            storagePath,
            uploadedAt: admin.firestore.Timestamp.now(),
            uploadedBy: "public",
            scanned: false,
            scanStatus: "pending",
        };
        await db
            .collection("submissions")
            .doc(submissionId)
            .update({
            attachments: admin.firestore.FieldValue.arrayUnion(attachment),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await updateStorageUsage(companyId, filesize);
        res.status(201).json({
            id: attachmentId,
            filename,
            fileSize: filesize,
            message: "File uploaded successfully",
        });
    }
    catch (error) {
        console.error("Public upload error:", error);
        res.status(500).json({ error: "Upload failed" });
    }
});
router.post("/api/submissions/:submissionId/attachments", async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { filename, filetype, filesize, base64data } = req.body;
        if (!submissionId || !filename || !filetype || !filesize || !base64data) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }
        // Validate file
        if (!isValidFileType(filename)) {
            res.status(400).json({ error: "File type not allowed" });
            return;
        }
        if (filesize > ATTACHMENT_CONFIG.maxFileSize) {
            res.status(400).json({ error: "File exceeds max size" });
            return;
        }
        // Get submission and check access
        const submissionDoc = await db
            .collection("submissions")
            .doc(submissionId)
            .get();
        if (!submissionDoc.exists) {
            res.status(404).json({ error: "Submission not found" });
            return;
        }
        const submission = submissionDoc.data();
        const companyId = submission.companyId;
        // Check if user has permission
        if (!req.permissions?.includes("submissions:write")) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        // Check storage quota
        const hasQuota = await checkStorageQuota(companyId, filesize);
        if (!hasQuota) {
            res.status(402).json({ error: "Storage quota exceeded" });
            return;
        }
        // Check submission size
        const submissionAttachments = submission.attachments || [];
        const submissionSize = submissionAttachments.reduce((sum, att) => sum + att.fileSize, 0);
        if (submissionSize + filesize > ATTACHMENT_CONFIG.maxSubmissionSize) {
            res.status(400).json({ error: "Submission size limit exceeded" });
            return;
        }
        // Upload to Firebase Storage
        const attachmentId = (0, uuid_1.v4)();
        const storagePath = `attachments/${companyId}/${submissionId}/${attachmentId}`;
        const file = bucket.file(storagePath);
        const buffer = Buffer.from(base64data, "base64");
        await file.save(buffer, { contentType: filetype });
        // Create attachment record
        const attachment = {
            id: attachmentId,
            filename,
            fileType: filetype,
            fileSize: filesize,
            storagePath,
            uploadedAt: admin.firestore.Timestamp.now(),
            uploadedBy: req.userId || "unknown",
            scanned: false,
            scanStatus: "pending",
        };
        // Add attachment to submission
        await db
            .collection("submissions")
            .doc(submissionId)
            .update({
            attachments: admin.firestore.FieldValue.arrayUnion(attachment),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Update storage usage
        await updateStorageUsage(companyId, filesize);
        res.status(201).json({
            id: attachmentId,
            filename,
            fileSize: filesize,
            message: "File uploaded successfully",
        });
    }
    catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Upload failed" });
    }
});
router.get("/api/submissions/:submissionId/attachments/:attachmentId/download", async (req, res) => {
    try {
        const { submissionId, attachmentId } = req.params;
        // Get submission
        const submissionDoc = await db
            .collection("submissions")
            .doc(submissionId)
            .get();
        if (!submissionDoc.exists) {
            res.status(404).json({ error: "Submission not found" });
            return;
        }
        const submission = submissionDoc.data();
        const attachment = submission.attachments?.find((a) => a.id === attachmentId);
        if (!attachment) {
            res.status(404).json({ error: "Attachment not found" });
            return;
        }
        // Check access - company members can download
        if (req.companyId !== submission.companyId || !req.permissions?.includes("submissions:read")) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        // Generate signed URL
        const [url] = await bucket.file(attachment.storagePath).getSignedUrl({
            version: "v4",
            action: "read",
            expires: Date.now() + 3600 * 1000, // 1 hour
        });
        res.json({ url, filename: attachment?.filename });
    }
    catch (error) {
        console.error("Download error:", error);
        res.status(500).json({ error: "Download failed" });
    }
});
router.delete("/api/submissions/:submissionId/attachments/:attachmentId", async (req, res) => {
    try {
        const { submissionId, attachmentId } = req.params;
        // Get submission
        const submissionDoc = await db
            .collection("submissions")
            .doc(submissionId)
            .get();
        if (!submissionDoc.exists) {
            res.status(404).json({ error: "Submission not found" });
            return;
        }
        const submission = submissionDoc.data();
        const attachment = submission.attachments?.find((a) => a.id === attachmentId);
        if (!attachment) {
            res.status(404).json({ error: "Attachment not found" });
            return;
        }
        // Check permission - manage submissions required
        if (req.companyId !== submission.companyId || !req.permissions?.includes("submissions:write")) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        // Delete from storage
        await bucket
            .file(attachment.storagePath)
            .delete()
            .catch((error) => {
            // File might not exist, continue anyway
            console.log("Storage deletion info:", error);
        });
        // Delete from Firestore
        await db
            .collection("submissions")
            .doc(submissionId)
            .update({
            attachments: admin.firestore.FieldValue.arrayRemove(attachment),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Update storage usage
        await updateStorageUsage(submission?.companyId, -attachment.fileSize);
        res.json({ message: "Attachment deleted" });
    }
    catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ error: "Delete failed" });
    }
});
exports.default = router;
//# sourceMappingURL=attachments.js.map