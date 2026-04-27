import { Router } from "express";
import * as admin from "firebase-admin";
import {
  verifyRBAC,
  requirePermission,
  canManageRole,
  auditLog,
  type PermissionRequest,
} from "../middleware/rbac";
import type { UserRole } from "../types";

const router = Router();

router.use(verifyRBAC);

// Get team members
router.get(
  "/:companyId/members",
  requirePermission("team:read"),
  async (req: PermissionRequest, res) => {
    try {
      const { companyId } = req.params;

      if (!req.user || req.user.companyId !== companyId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const snapshot = await admin
        .firestore()
        .collection("users")
        .where("companyId", "==", companyId)
        .get();

      const members = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          userId: doc.id,
          email: data.email,
          name: data.name,
          role: data.role,
          joinedAt: data.createdAt,
          lastActive: data.lastActive,
        };
      });

      res.json({ members });
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  },
);

// Update member role
router.put(
  "/:companyId/members/:userId/role",
  requirePermission("team:manage"),
  async (req: PermissionRequest, res) => {
    try {
      const { companyId, userId } = req.params;
      const { newRole } = req.body;

      if (!req.user || req.user.companyId !== companyId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (!["owner", "admin", "manager", "viewer"].includes(newRole)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      // Get current role
      const targetUser = await admin
        .firestore()
        .collection("users")
        .doc(userId)
        .get();
      if (!targetUser.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const targetData = targetUser.data() as Record<string, unknown>;
      const currentRole = (targetData as Record<string, unknown>)
        .role as string;
      // Check if user can manage this role
      if (!canManageRole(req.user.role, currentRole as UserRole)) {
        return res.status(403).json({
          error: "Cannot change role of user with equal or higher privilege",
        });
      }

      if (!canManageRole(req.user.role, newRole as UserRole)) {
        return res
          .status(403)
          .json({ error: "Cannot assign a role of equal or higher privilege" });
      }

      // Prevent removing last owner
      if (currentRole === "owner" && newRole !== "owner") {
        const owners = await admin
          .firestore()
          .collection("users")
          .where("companyId", "==", companyId)
          .where("role", "==", "owner")
          .get();

        if (owners.size <= 1) {
          return res
            .status(400)
            .json({ error: "Cannot remove the last owner" });
        }
      }

      // Update role
      await admin.firestore().collection("users").doc(userId).update({
        role: newRole,
      });

      // Audit log
      await auditLog(companyId, req.user.uid, "role_changed", {
        targetUserId: userId,
        oldRole: currentRole,
        newRole,
      });

      res.json({ success: true, message: "Role updated" });
    } catch (error) {
      console.error("Error updating member role:", error);
      res.status(500).json({ error: "Failed to update member role" });
    }
  },
);

// Remove team member
router.delete(
  "/:companyId/members/:userId",
  requirePermission("team:manage"),
  async (req: PermissionRequest, res) => {
    try {
      const { companyId, userId } = req.params;

      if (!req.user || req.user.companyId !== companyId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (userId === req.user.uid) {
        return res.status(400).json({ error: "Cannot remove yourself" });
      }

      const user = await admin
        .firestore()
        .collection("users")
        .doc(userId)
        .get();
      if (!user.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = user.data() as Record<string, unknown>;
      if (
        !canManageRole(
          req.user.role,
          (userData as Record<string, unknown>).role as UserRole,
        )
      ) {
        return res
          .status(403)
          .json({ error: "Cannot remove user with equal or higher privilege" });
      }

      // Prevent removing last owner
      if (userData.role === "owner") {
        const owners = await admin
          .firestore()
          .collection("users")
          .where("companyId", "==", companyId)
          .where("role", "==", "owner")
          .get();

        if (owners.size <= 1) {
          return res
            .status(400)
            .json({ error: "Cannot remove the last owner" });
        }
      }

      await admin.firestore().collection("users").doc(userId).delete();

      // Audit log
      await auditLog(companyId, req.user.uid, "member_removed", {
        targetUserId: userId,
        role: userData.role,
      });

      res.json({ success: true, message: "Member removed" });
    } catch (error) {
      console.error("Error removing team member:", error);
      res.status(500).json({ error: "Failed to remove team member" });
    }
  },
);

// Get audit logs
router.get(
  "/:companyId/audit-logs",
  requirePermission("audit:read"),
  async (req: PermissionRequest, res) => {
    try {
      const { companyId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      if (!req.user || req.user.companyId !== companyId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const snapshot = await admin
        .firestore()
        .collection("companies")
        .doc(companyId)
        .collection("audit_logs")
        .orderBy("timestamp", "desc")
        .limit(Math.min(parseInt(limit as string) || 50, 100))
        .offset(parseInt(offset as string) || 0)
        .get();

      const logs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.json({ logs });
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  },
);

export default router;
