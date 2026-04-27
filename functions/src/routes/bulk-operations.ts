import * as admin from "firebase-admin";
import { Router, Response } from "express";
import { AuthenticatedRequest, hasPermission } from "../middleware/auth";
import { v4 as uuidv4 } from "uuid";

const router = Router();
const db = admin.firestore();

const BATCH_SIZE = 100;
const UNDO_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours

interface BulkOperationPayload {
  submissionIds: string[];
  [key: string]: unknown;
}

async function createBulkOperation(
  companyId: string,
  operationType: string,
  submissionIds: string[],
  updateData: Record<string, unknown>,
  userId: string,
  userName: string,
  userEmail: string,
): Promise<Record<string, unknown>> {
  const operationId = uuidv4();
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
    id: uuidv4(),
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

async function processBulkOperation(operationId: string): Promise<void> {
  const operationRef = db.collection("bulkOperations").doc(operationId);
  const operationDoc = await operationRef.get();

  if (!operationDoc.exists) {
    throw new Error("Operation not found");
  }

  const operation = operationDoc.data() as Record<string, unknown>;
  const { submissionIds, updateData, companyId } = operation || {};

  let processedCount = 0;
  const previousValues: Array<{
    submissionId: string;
    previousData: Record<string, unknown>;
  }> = [];

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
            previousData: Object.keys(updateData).reduce(
              (acc: Record<string, unknown>, key) => {
                (acc as Record<string, unknown>)[key] = data[key];
                return acc;
              },
              {} as Record<string, unknown>,
            ),
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
      id: uuidv4(),
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
  } catch (error) {
    console.error("Bulk operation error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await operationRef.update({
      status: "failed",
      errorMessage,
      processedCount,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    throw error;
  }
}

router.post(
  "/api/bulk-operations/status",
  hasPermission(["submissions:write"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { submissionIds, status } = req.body as BulkOperationPayload & {
        status: string;
      };
      const companyId = req.companyId;
      const userId = req.userId;

      if (
        !submissionIds ||
        !Array.isArray(submissionIds) ||
        submissionIds.length === 0
      ) {
        res.status(400).json({ error: "Invalid submission IDs" });
        return;
      }

      if (!status) {
        res.status(400).json({ error: "Status is required" });
        return;
      }

      const user = await db.collection("users").doc(userId).get();
      const userData = user.data();

      const operation = await createBulkOperation(
        companyId,
        "status",
        submissionIds,
        { status },
        userId,
        userData?.name || "Unknown",
        userData?.email || "unknown@example.com",
      );

      // Process asynchronously
      processBulkOperation((operation as Record<string, unknown>)?.id as string || "").catch(console.error);

      res.status(202).json(operation);
    } catch (error) {
      console.error("Bulk status update error:", error);
      res.status(500).json({ error: "Failed to update statuses" });
    }
  },
);

router.post(
  "/api/bulk-operations/priority",
  hasPermission(["submissions:write"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { submissionIds, priority } = req.body as BulkOperationPayload & {
        priority: string;
      };
      const companyId = req.companyId;
      const userId = req.userId;

      if (
        !submissionIds ||
        !Array.isArray(submissionIds) ||
        submissionIds.length === 0
      ) {
        res.status(400).json({ error: "Invalid submission IDs" });
        return;
      }

      if (!priority) {
        res.status(400).json({ error: "Priority is required" });
        return;
      }

      const user = await db.collection("users").doc(userId).get();
      const userData = user.data();

      const operation = await createBulkOperation(
        companyId,
        "priority",
        submissionIds,
        { priority },
        userId,
        userData?.name || "Unknown",
        userData?.email || "unknown@example.com",
      );

      processBulkOperation(operation.id).catch(console.error);

      res.status(202).json(operation);
    } catch (error) {
      console.error("Bulk priority update error:", error);
      res.status(500).json({ error: "Failed to update priorities" });
    }
  },
);

router.post(
  "/api/bulk-operations/assign",
  hasPermission(["submissions:write"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { submissionIds, assignedTo } = req.body as BulkOperationPayload & {
        assignedTo: string;
      };
      const companyId = req.companyId;
      const userId = req.userId;

      if (
        !submissionIds ||
        !Array.isArray(submissionIds) ||
        submissionIds.length === 0
      ) {
        res.status(400).json({ error: "Invalid submission IDs" });
        return;
      }

      if (!assignedTo) {
        res.status(400).json({ error: "Assigned user is required" });
        return;
      }

      const user = await db.collection("users").doc(userId).get();
      const userData = user.data();

      const operation = await createBulkOperation(
        companyId,
        "assign",
        submissionIds,
        { assignedTo },
        userId,
        userData?.name || "Unknown",
        userData?.email || "unknown@example.com",
      );

      processBulkOperation(operation.id).catch(console.error);

      res.status(202).json(operation);
    } catch (error) {
      console.error("Bulk assign error:", error);
      res.status(500).json({ error: "Failed to assign submissions" });
    }
  },
);

router.post(
  "/api/bulk-operations/category",
  hasPermission(["submissions:write"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { submissionIds, category } = req.body as BulkOperationPayload & {
        category: string;
      };
      const companyId = req.companyId;
      const userId = req.userId;

      if (
        !submissionIds ||
        !Array.isArray(submissionIds) ||
        submissionIds.length === 0
      ) {
        res.status(400).json({ error: "Invalid submission IDs" });
        return;
      }

      if (!category) {
        res.status(400).json({ error: "Category is required" });
        return;
      }

      const user = await db.collection("users").doc(userId).get();
      const userData = user.data();

      const operation = await createBulkOperation(
        companyId,
        "category",
        submissionIds,
        { category },
        userId,
        userData?.name || "Unknown",
        userData?.email || "unknown@example.com",
      );

      processBulkOperation(operation.id).catch(console.error);

      res.status(202).json(operation);
    } catch (error) {
      console.error("Bulk category update error:", error);
      res.status(500).json({ error: "Failed to update categories" });
    }
  },
);

router.post(
  "/api/bulk-operations/delete",
  hasPermission(["submissions:delete"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { submissionIds } = req.body as BulkOperationPayload;
      const companyId = req.companyId;
      const userId = req.userId;

      if (
        !submissionIds ||
        !Array.isArray(submissionIds) ||
        submissionIds.length === 0
      ) {
        res.status(400).json({ error: "Invalid submission IDs" });
        return;
      }

      const user = await db.collection("users").doc(userId).get();
      const userData = user.data();

      const operation = await createBulkOperation(
        companyId,
        "delete",
        submissionIds,
        {},
        userId,
        userData?.name || "Unknown",
        userData?.email || "unknown@example.com",
      );

      processBulkOperation(operation.id).catch(console.error);

      res.status(202).json(operation);
    } catch (error) {
      console.error("Bulk delete error:", error);
      res.status(500).json({ error: "Failed to delete submissions" });
    }
  },
);

router.post(
  "/api/bulk-operations/:id/undo",
  hasPermission(["submissions:write"]),
  async (req: AuthenticatedRequest, res: Response) => {
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
        const undoOperationId = uuidv4();
        const undoOperation = {
          id: undoOperationId,
          companyId,
          operationId: id,
          originalBulkOperation: operation,
          restoredAt: admin.firestore.FieldValue.serverTimestamp(),
          restoredBy: userId,
          expiresAt: admin.firestore.Timestamp.fromDate(
            new Date(Date.now() + UNDO_WINDOW_MS),
          ),
        };

        await db
          .collection("undoOperations")
          .doc(undoOperationId)
          .set(undoOperation);

        // Create audit log
        const user = await db.collection("users").doc(userId).get();
        const userData = user.data();
        const auditLog = {
          id: uuidv4(),
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
      } else {
        res
          .status(400)
          .json({ error: "No previous values stored for this operation" });
      }
    } catch (error) {
      console.error("Undo operation error:", error);
      res.status(500).json({ error: "Failed to undo operation" });
    }
  },
);

router.get(
  "/api/bulk-operations/:id",
  hasPermission(["submissions:read"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const operationDoc = await db.collection("bulkOperations").doc(id).get();

      if (!operationDoc.exists) {
        res.status(404).json({ error: "Operation not found" });
        return;
      }

      res.json(operationDoc.data());
    } catch (error) {
      console.error("Get operation error:", error);
      res.status(500).json({ error: "Failed to fetch operation" });
    }
  },
);

export default router;
