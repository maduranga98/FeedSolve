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
router.post('/api/filters', (0, auth_1.hasPermission)(['submissions:read']), async (req, res) => {
    try {
        const companyId = req.companyId;
        const userId = req.userId;
        const { name, description, filters } = req.body;
        if (!companyId || !userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (!name || !filters) {
            res.status(400).json({ error: 'Name and filters are required' });
            return;
        }
        const filterId = (0, uuid_1.v4)();
        const filterData = {
            id: filterId,
            companyId,
            name,
            description: description || '',
            filters,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: userId,
            isPinned: false,
        };
        const filterRef = db.collection('companies').doc(companyId).collection('filters').doc(filterId);
        await filterRef.set(filterData);
        res.status(201).json({
            ...filterData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Create filter error:', error);
        res.status(500).json({ error: 'Failed to create filter' });
    }
});
router.get('/api/filters', (0, auth_1.hasPermission)(['submissions:read']), async (req, res) => {
    try {
        const companyId = req.companyId;
        if (!companyId) {
            res.status(401).json({ error: 'Company not found' });
            return;
        }
        const filterRef = db.collection('companies').doc(companyId).collection('filters');
        const snapshot = await filterRef.orderBy('isPinned', 'desc').orderBy('createdAt', 'desc').get();
        const filters = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.()?.toISOString(),
                updatedAt: data.updatedAt?.toDate?.()?.toISOString(),
            };
        });
        res.json({ filters });
    }
    catch (error) {
        console.error('List filters error:', error);
        res.status(500).json({ error: 'Failed to list filters' });
    }
});
router.put('/api/filters/:id', (0, auth_1.hasPermission)(['submissions:read']), async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.companyId;
        const { name, description, filters } = req.body;
        if (!companyId) {
            res.status(401).json({ error: 'Company not found' });
            return;
        }
        if (!name || !filters) {
            res.status(400).json({ error: 'Name and filters are required' });
            return;
        }
        const filterRef = db.collection('companies').doc(companyId).collection('filters').doc(id);
        const updateData = {
            name,
            description: description || '',
            filters,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await filterRef.update(updateData);
        const updatedDoc = await filterRef.get();
        const data = updatedDoc.data();
        res.json({
            id: updatedDoc.id,
            ...data,
            createdAt: data?.createdAt?.toDate?.()?.toISOString(),
            updatedAt: data?.updatedAt?.toDate?.()?.toISOString(),
        });
    }
    catch (error) {
        console.error('Update filter error:', error);
        res.status(500).json({ error: 'Failed to update filter' });
    }
});
router.delete('/api/filters/:id', (0, auth_1.hasPermission)(['submissions:read']), async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.companyId;
        if (!companyId) {
            res.status(401).json({ error: 'Company not found' });
            return;
        }
        const filterRef = db.collection('companies').doc(companyId).collection('filters').doc(id);
        await filterRef.delete();
        res.status(204).send();
    }
    catch (error) {
        console.error('Delete filter error:', error);
        res.status(500).json({ error: 'Failed to delete filter' });
    }
});
router.patch('/api/filters/:id/pin', (0, auth_1.hasPermission)(['submissions:read']), async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.companyId;
        const { isPinned } = req.body;
        if (!companyId) {
            res.status(401).json({ error: 'Company not found' });
            return;
        }
        const filterRef = db.collection('companies').doc(companyId).collection('filters').doc(id);
        await filterRef.update({
            isPinned: !!isPinned,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        const updatedDoc = await filterRef.get();
        const data = updatedDoc.data();
        res.json({
            id: updatedDoc.id,
            ...data,
            createdAt: data?.createdAt?.toDate?.()?.toISOString(),
            updatedAt: data?.updatedAt?.toDate?.()?.toISOString(),
        });
    }
    catch (error) {
        console.error('Update pin status error:', error);
        res.status(500).json({ error: 'Failed to update pin status' });
    }
});
exports.default = router;
//# sourceMappingURL=filters.js.map