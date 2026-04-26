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
const express_1 = require("express");
const admin = __importStar(require("firebase-admin"));
const rbac_1 = require("../middleware/rbac");
const router = (0, express_1.Router)();
router.use(rbac_1.verifyRBAC);
// Get team members
router.get('/:companyId/members', (0, rbac_1.requirePermission)('team:read'), async (req, res) => {
    try {
        const { companyId } = req.params;
        if (!req.user || req.user.companyId !== companyId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const snapshot = await admin
            .firestore()
            .collection('users')
            .where('companyId', '==', companyId)
            .get();
        const members = snapshot.docs.map(doc => {
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
    }
    catch (error) {
        console.error('Error fetching team members:', error);
        res.status(500).json({ error: 'Failed to fetch team members' });
    }
});
// Update member role
router.put('/:companyId/members/:userId/role', (0, rbac_1.requirePermission)('team:manage'), async (req, res) => {
    try {
        const { companyId, userId } = req.params;
        const { newRole } = req.body;
        if (!req.user || req.user.companyId !== companyId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        if (!['owner', 'admin', 'manager', 'viewer'].includes(newRole)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        // Get current role
        const targetUser = await admin.firestore().collection('users').doc(userId).get();
        if (!targetUser.exists) {
            return res.status(404).json({ error: 'User not found' });
        }
        const targetData = targetUser.data();
        const currentRole = targetData.role;
        // Check if user can manage this role
        if (!(0, rbac_1.canManageRole)(req.user.role, currentRole)) {
            return res.status(403).json({ error: 'Cannot change role of user with equal or higher privilege' });
        }
        if (!(0, rbac_1.canManageRole)(req.user.role, newRole)) {
            return res.status(403).json({ error: 'Cannot assign a role of equal or higher privilege' });
        }
        // Prevent removing last owner
        if (currentRole === 'owner' && newRole !== 'owner') {
            const owners = await admin
                .firestore()
                .collection('users')
                .where('companyId', '==', companyId)
                .where('role', '==', 'owner')
                .get();
            if (owners.size <= 1) {
                return res.status(400).json({ error: 'Cannot remove the last owner' });
            }
        }
        // Update role
        await admin.firestore().collection('users').doc(userId).update({
            role: newRole,
        });
        // Audit log
        await (0, rbac_1.auditLog)(companyId, req.user.uid, 'role_changed', {
            targetUserId: userId,
            oldRole: currentRole,
            newRole,
        });
        res.json({ success: true, message: 'Role updated' });
    }
    catch (error) {
        console.error('Error updating member role:', error);
        res.status(500).json({ error: 'Failed to update member role' });
    }
});
// Remove team member
router.delete('/:companyId/members/:userId', (0, rbac_1.requirePermission)('team:manage'), async (req, res) => {
    try {
        const { companyId, userId } = req.params;
        if (!req.user || req.user.companyId !== companyId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        if (userId === req.user.uid) {
            return res.status(400).json({ error: 'Cannot remove yourself' });
        }
        const user = await admin.firestore().collection('users').doc(userId).get();
        if (!user.exists) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userData = user.data();
        if (!(0, rbac_1.canManageRole)(req.user.role, userData.role)) {
            return res.status(403).json({ error: 'Cannot remove user with equal or higher privilege' });
        }
        // Prevent removing last owner
        if (userData.role === 'owner') {
            const owners = await admin
                .firestore()
                .collection('users')
                .where('companyId', '==', companyId)
                .where('role', '==', 'owner')
                .get();
            if (owners.size <= 1) {
                return res.status(400).json({ error: 'Cannot remove the last owner' });
            }
        }
        await admin.firestore().collection('users').doc(userId).delete();
        // Audit log
        await (0, rbac_1.auditLog)(companyId, req.user.uid, 'member_removed', {
            targetUserId: userId,
            role: userData.role,
        });
        res.json({ success: true, message: 'Member removed' });
    }
    catch (error) {
        console.error('Error removing team member:', error);
        res.status(500).json({ error: 'Failed to remove team member' });
    }
});
// Get audit logs
router.get('/:companyId/audit-logs', (0, rbac_1.requirePermission)('audit:read'), async (req, res) => {
    try {
        const { companyId } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        if (!req.user || req.user.companyId !== companyId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const snapshot = await admin
            .firestore()
            .collection('companies')
            .doc(companyId)
            .collection('audit_logs')
            .orderBy('timestamp', 'desc')
            .limit(Math.min(parseInt(limit) || 50, 100))
            .offset(parseInt(offset) || 0)
            .get();
        const logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        res.json({ logs });
    }
    catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});
exports.default = router;
//# sourceMappingURL=team.js.map