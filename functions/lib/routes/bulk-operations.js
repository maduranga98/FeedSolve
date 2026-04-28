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
const auth_1 = require("../middleware/auth");
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
const db = admin.firestore();
const BATCH_SIZE = 100;
const UNDO_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours
async function createBulkOperation(companyId, operationType, submissionIds, updateData, userId, userName, userEmail) {
    const operationId = (0, uuid_1.v4)();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const operation = {
        id: operationId,
        companyId,
        operationType,
        submissionIds,
        updateData,
        status: "pending",
        processedCount: 0,
        totalCount: submissionIds.length,
        createdBy: userId,
        createdAt: timestamp,
    };
    const auditLog = {
        id: (0, uuid_1.v4)(),
        companyId,
        operationId,
        operationType,
        submissionCount: submissionIds.length,
        createdBy: userId,
        userId,
        userName,
        userEmail,
        action: "created",
        details: updateData,
        createdAt: timestamp,
    };
    await db.collection("bulkOperations").doc(operationId).set(operation);
    await db.collection("bulkOperationLogs").doc(auditLog.id).set(auditLog);
    return operation;
}
async function processBulkOperation(operationId) {
    const operationRef = db.collection("bulkOperations").doc(operationId);
    const operationDoc = await operationRef.get();
    if (!operationDoc.exists) {
        throw new Error("Operation not found");
    }
    const operation = operationDoc.data();
    const submissionIds = operation.submissionIds;
    const updateData = operation.updateData;
    const companyId = operation.companyId;
    let processedCount = 0;
    const previousValues = [];
    try {
        // Process in batches to avoid timeout
        for (let i = 0; i < submissionIds.length; i += BATCH_SIZE) {
            const batch = db.batch();
            const batchIds = submissionIds.slice(i, i + BATCH_SIZE);
            for (const submissionId of batchIds) {
                const submissionRef = db.collection("submissions").doc(submissionId);
                const submissionDoc = await submissionRef.get();
                if (submissionDoc.exists) {
                    const data = submissionDoc.data();
                    previousValues.push({
                        submissionId,
                        previousData: Object.keys(updateData).reduce((acc, key) => {
                            acc[key] = data?.[key];
                            return acc;
                        }, {}),
                    });
                    batch.update(submissionRef, {
                        ...updateData,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    processedCount++;
                }
            }
            await batch.commit();
            // Update progress
            await operationRef.update({
                processedCount,
            });
        }
        // Mark as completed
        await operationRef.update({
            status: "completed",
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            previousValues,
        });
        // Create audit log for completion
        const auditLog = {
            id: (0, uuid_1.v4)(),
            companyId,
            operationId,
            operationType: operation.operationType,
            submissionCount: submissionIds.length,
            createdBy: operation.createdBy,
            userId: operation.createdBy,
            action: "completed",
            details: { processedCount },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection("bulkOperationLogs").doc(auditLog.id).set(auditLog);
    }
    catch (error) {
        console.error("Bulk operation error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await operationRef.update({
            status: "failed",
            errorMessage,
            processedCount,
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        throw error;
    }
}
router.post("/api/bulk-operations/status", (0, auth_1.hasPermission)(["submissions:write"]), async (req, res) => {
    try {
        const { submissionIds, status } = req.body;
        const companyId = req.companyId;
        const userId = req.userId;
        if (!submissionIds ||
            !Array.isArray(submissionIds) ||
            submissionIds.length === 0) {
            res.status(400).json({ error: "Invalid submission IDs" });
            return;
        }
        if (!status) {
            res.status(400).json({ error: "Status is required" });
            return;
        }
        const user = await db.collection("users").doc(userId).get();
        const userData = user.data();
        const operation = await createBulkOperation(companyId, "status", submissionIds, { status }, userId, userData?.name || "Unknown", userData?.email || "unknown@example.com");
        // Process asynchronously
        processBulkOperation(operation.id).catch(console.error);
        res.status(202).json(operation);
    }
    catch (error) {
        console.error("Bulk status update error:", error);
        res.status(500).json({ error: "Failed to update statuses" });
    }
});
router.post("/api/bulk-operations/priority", (0, auth_1.hasPermission)(["submissions:write"]), async (req, res) => {
    try {
        const { submissionIds, priority } = req.body;
        const companyId = req.companyId;
        const userId = req.userId;
        if (!submissionIds ||
            !Array.isArray(submissionIds) ||
            submissionIds.length === 0) {
            res.status(400).json({ error: "Invalid submission IDs" });
            return;
        }
        if (!priority) {
            res.status(400).json({ error: "Priority is required" });
            return;
        }
        const user = await db.collection("users").doc(userId).get();
        const userData = user.data();
        const operation = await createBulkOperation(companyId, "priority", submissionIds, { priority }, userId, userData?.name || "Unknown", userData?.email || "unknown@example.com");
        processBulkOperation(operation.id).catch(console.error);
        res.status(202).json(operation);
    }
    catch (error) {
        console.error("Bulk priority update error:", error);
        res.status(500).json({ error: "Failed to update priorities" });
    }
});
router.post("/api/bulk-operations/assign", (0, auth_1.hasPermission)(["submissions:write"]), async (req, res) => {
    try {
        const { submissionIds, assignedTo } = req.body;
        const companyId = req.companyId;
        const userId = req.userId;
        if (!submissionIds ||
            !Array.isArray(submissionIds) ||
            submissionIds.length === 0) {
            res.status(400).json({ error: "Invalid submission IDs" });
            return;
        }
        if (!assignedTo) {
            res.status(400).json({ error: "Assigned user is required" });
            return;
        }
        const user = await db.collection("users").doc(userId).get();
        const userData = user.data();
        const operation = await createBulkOperation(companyId, "assign", submissionIds, { assignedTo }, userId, userData?.name || "Unknown", userData?.email || "unknown@example.com");
        processBulkOperation(operation.id).catch(console.error);
        res.status(202).json(operation);
    }
    catch (error) {
        console.error("Bulk assign error:", error);
        res.status(500).json({ error: "Failed to assign submissions" });
    }
});
router.post("/api/bulk-operations/category", (0, auth_1.hasPermission)(["submissions:write"]), async (req, res) => {
    try {
        const { submissionIds, category } = req.body;
        const companyId = req.companyId;
        const userId = req.userId;
        if (!submissionIds ||
            !Array.isArray(submissionIds) ||
            submissionIds.length === 0) {
            res.status(400).json({ error: "Invalid submission IDs" });
            return;
        }
        if (!category) {
            res.status(400).json({ error: "Category is required" });
            return;
        }
        const user = await db.collection("users").doc(userId).get();
        const userData = user.data();
        const operation = await createBulkOperation(companyId, "category", submissionIds, { category }, userId, userData?.name || "Unknown", userData?.email || "unknown@example.com");
        processBulkOperation(operation.id).catch(console.error);
        res.status(202).json(operation);
    }
    catch (error) {
        console.error("Bulk category update error:", error);
        res.status(500).json({ error: "Failed to update categories" });
    }
});
router.post("/api/bulk-operations/delete", (0, auth_1.hasPermission)(["submissions:delete"]), async (req, res) => {
    try {
        const { submissionIds } = req.body;
        const companyId = req.companyId;
        const userId = req.userId;
        if (!submissionIds ||
            !Array.isArray(submissionIds) ||
            submissionIds.length === 0) {
            res.status(400).json({ error: "Invalid submission IDs" });
            return;
        }
        const user = await db.collection("users").doc(userId).get();
        const userData = user.data();
        const operation = await createBulkOperation(companyId, "delete", submissionIds, {}, userId, userData?.name || "Unknown", userData?.email || "unknown@example.com");
        processBulkOperation(operation.id).catch(console.error);
        res.status(202).json(operation);
    }
    catch (error) {
        console.error("Bulk delete error:", error);
        res.status(500).json({ error: "Failed to delete submissions" });
    }
});
router.post("/api/bulk-operations/:id/undo", (0, auth_1.hasPermission)(["submissions:write"]), async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.companyId;
        const userId = req.userId;
        const operationRef = db.collection("bulkOperations").doc(id);
        const operationDoc = await operationRef.get();
        if (!operationDoc.exists) {
            res.status(404).json({ error: "Operation not found" });
            return;
        }
        const operation = operationDoc.data();
        // Check if operation is still within undo window
        const createdAt = operation.createdAt?.toDate?.()?.getTime() || 0;
        const now = Date.now();
        if (now - createdAt > UNDO_WINDOW_MS) {
            res.status(400).json({ error: "Undo window has expired (6 hours)" });
            return;
        }
        if (operation.status !== "completed") {
            res.status(400).json({ error: "Can only undo completed operations" });
            return;
        }
        // Restore previous values
        if (operation.previousValues && Array.isArray(operation.previousValues)) {
            let processedCount = 0;
            for (let i = 0; i < operation.previousValues.length; i += BATCH_SIZE) {
                const batch = db.batch();
                const batchData = operation.previousValues.slice(i, i + BATCH_SIZE);
                for (const item of batchData) {
                    const submissionRef = db
                        .collection("submissions")
                        .doc(item.submissionId);
                    batch.update(submissionRef, {
                        ...item.previousData,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    processedCount++;
                }
                await batch.commit();
            }
            // Create undo operation
            const undoOperationId = (0, uuid_1.v4)();
            const undoOperation = {
                id: undoOperationId,
                companyId,
                operationId: id,
                originalBulkOperation: operation,
                restoredAt: admin.firestore.FieldValue.serverTimestamp(),
                restoredBy: userId,
                expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + UNDO_WINDOW_MS)),
            };
            await db
                .collection("undoOperations")
                .doc(undoOperationId)
                .set(undoOperation);
            // Create audit log
            const user = await db.collection("users").doc(userId).get();
            const userData = user.data();
            const auditLog = {
                id: (0, uuid_1.v4)(),
                companyId,
                operationId: id,
                operationType: operation.operationType,
                submissionCount: operation.submissionIds.length,
                createdBy: userId,
                userId,
                userName: userData?.name || "Unknown",
                userEmail: userData?.email || "unknown@example.com",
                action: "undone",
                details: { undoOperationId },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            await db.collection("bulkOperationLogs").doc(auditLog.id).set(auditLog);
            res.json({
                ...undoOperation,
                message: `Successfully restored ${processedCount} submissions`,
            });
        }
        else {
            res
                .status(400)
                .json({ error: "No previous values stored for this operation" });
        }
    }
    catch (error) {
        console.error("Undo operation error:", error);
        res.status(500).json({ error: "Failed to undo operation" });
    }
});
router.get("/api/bulk-operations/:id", (0, auth_1.hasPermission)(["submissions:read"]), async (req, res) => {
    try {
        const { id } = req.params;
        const operationDoc = await db.collection("bulkOperations").doc(id).get();
        if (!operationDoc.exists) {
            res.status(404).json({ error: "Operation not found" });
            return;
        }
        res.json(operationDoc.data());
    }
    catch (error) {
        console.error("Get operation error:", error);
        res.status(500).json({ error: "Failed to fetch operation" });
    }
});
exports.default = router;
//# sourceMappingURL=bulk-operations.js.map