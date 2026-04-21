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
const router = (0, express_1.Router)();
const db = admin.firestore();
router.get('/api/company/stats', (0, auth_1.hasPermission)(['stats:read']), async (req, res) => {
    try {
        const companyId = req.companyId;
        if (!companyId) {
            res.status(401).json({ error: 'Company not found' });
            return;
        }
        const submissionsSnapshot = await db
            .collection('submissions')
            .where('companyId', '==', companyId)
            .get();
        const submissions = submissionsSnapshot.docs.map((doc) => doc.data());
        const totalSubmissions = submissions.length;
        const resolved = submissions.filter((s) => s.status === 'resolved').length;
        const resolutionRate = totalSubmissions > 0 ? ((resolved / totalSubmissions) * 100).toFixed(1) : 0;
        const submissionsByStatus = {
            received: submissions.filter((s) => s.status === 'received').length,
            in_review: submissions.filter((s) => s.status === 'in_review').length,
            in_progress: submissions.filter((s) => s.status === 'in_progress').length,
            resolved: submissions.filter((s) => s.status === 'resolved').length,
            closed: submissions.filter((s) => s.status === 'closed').length,
        };
        const submissionsByPriority = {
            low: submissions.filter((s) => s.priority === 'low').length,
            medium: submissions.filter((s) => s.priority === 'medium').length,
            high: submissions.filter((s) => s.priority === 'high').length,
            critical: submissions.filter((s) => s.priority === 'critical').length,
        };
        const boardsSnapshot = await db
            .collection('boards')
            .where('companyId', '==', companyId)
            .get();
        const submissionsByBoard = {};
        boardsSnapshot.docs.forEach((doc) => {
            const boardId = doc.id;
            const count = submissions.filter((s) => s.boardId === boardId).length;
            submissionsByBoard[boardId] = count;
        });
        res.json({
            totalSubmissions,
            resolutionRate: parseFloat(resolutionRate),
            avgResolutionDays: 2.3,
            submissionsByStatus,
            submissionsByPriority,
            submissionsByBoard,
        });
    }
    catch (error) {
        console.error('Get company stats error:', error);
        res.status(500).json({ error: 'Failed to fetch company stats' });
    }
});
router.get('/api/boards/:id/stats', (0, auth_1.hasPermission)(['stats:read']), async (req, res) => {
    try {
        const { id } = req.params;
        const submissionsSnapshot = await db
            .collection('submissions')
            .where('boardId', '==', id)
            .get();
        const submissions = submissionsSnapshot.docs.map((doc) => doc.data());
        const totalSubmissions = submissions.length;
        const resolved = submissions.filter((s) => s.status === 'resolved').length;
        const resolutionRate = totalSubmissions > 0 ? ((resolved / totalSubmissions) * 100).toFixed(1) : 0;
        const submissionsByStatus = {
            received: submissions.filter((s) => s.status === 'received').length,
            in_review: submissions.filter((s) => s.status === 'in_review').length,
            in_progress: submissions.filter((s) => s.status === 'in_progress').length,
            resolved: submissions.filter((s) => s.status === 'resolved').length,
            closed: submissions.filter((s) => s.status === 'closed').length,
        };
        const submissionsByCategory = {};
        submissions.forEach((s) => {
            const category = s.category || 'Other';
            submissionsByCategory[category] = (submissionsByCategory[category] || 0) + 1;
        });
        res.json({
            boardId: id,
            totalSubmissions,
            resolutionRate: parseFloat(resolutionRate),
            submissionsByStatus,
            submissionsByCategory,
        });
    }
    catch (error) {
        console.error('Get board stats error:', error);
        res.status(500).json({ error: 'Failed to fetch board stats' });
    }
});
router.get('/api/auth/me', async (req, res) => {
    try {
        const companyId = req.companyId;
        if (!companyId) {
            res.status(401).json({ error: 'Company not found' });
            return;
        }
        const companyDoc = await db.collection('companies').doc(companyId).get();
        if (!companyDoc.exists) {
            res.status(404).json({ error: 'Company not found' });
            return;
        }
        const company = companyDoc.data();
        res.json({
            companyId,
            companyName: company?.name,
            tier: company?.tier || 'free',
        });
    }
    catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Failed to fetch user info' });
    }
});
router.get('/api/company', (0, auth_1.hasPermission)(['company:read']), async (req, res) => {
    try {
        const companyId = req.companyId;
        if (!companyId) {
            res.status(401).json({ error: 'Company not found' });
            return;
        }
        const companyDoc = await db.collection('companies').doc(companyId).get();
        if (!companyDoc.exists) {
            res.status(404).json({ error: 'Company not found' });
            return;
        }
        const company = companyDoc.data();
        res.json({
            id: companyId,
            name: company?.name,
            email: company?.email,
            tier: company?.tier || 'free',
            createdAt: company?.createdAt?.toDate?.()?.toISOString(),
        });
    }
    catch (error) {
        console.error('Get company error:', error);
        res.status(500).json({ error: 'Failed to fetch company' });
    }
});
exports.default = router;
//# sourceMappingURL=stats.js.map