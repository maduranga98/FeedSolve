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
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}
router.post('/api/boards', (0, auth_1.hasPermission)(['boards:create']), async (req, res) => {
    try {
        const { name, description, categories, isAnonymousAllowed } = req.body;
        const companyId = req.companyId;
        if (!companyId) {
            res.status(401).json({ error: 'Company not found' });
            return;
        }
        if (!name) {
            res.status(400).json({ error: 'Board name is required' });
            return;
        }
        const boardId = (0, uuid_1.v4)();
        const slug = slugify(name);
        const board = {
            id: boardId,
            companyId,
            name,
            description: description || '',
            slug,
            categories: categories || [],
            isAnonymousAllowed: isAnonymousAllowed !== false,
            qrCodeUrl: `https://feedsolve.com/b/${slug}`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection('boards').doc(boardId).set(board);
        res.status(201).json({
            id: boardId,
            name,
            slug,
            qrCodeUrl: board.qrCodeUrl,
            createdAt: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Create board error:', error);
        res.status(500).json({ error: 'Failed to create board' });
    }
});
router.get('/api/boards/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const boardDoc = await db.collection('boards').doc(id).get();
        if (!boardDoc.exists) {
            res.status(404).json({ error: 'Board not found' });
            return;
        }
        const board = boardDoc.data();
        res.json({
            id: board?.id,
            name: board?.name,
            description: board?.description,
            slug: board?.slug,
            categories: board?.categories,
            isAnonymousAllowed: board?.isAnonymousAllowed,
            createdAt: board?.createdAt?.toDate?.()?.toISOString(),
        });
    }
    catch (error) {
        console.error('Get board error:', error);
        res.status(500).json({ error: 'Failed to fetch board' });
    }
});
router.get('/api/company/boards', (0, auth_1.hasPermission)(['boards:read']), async (req, res) => {
    try {
        const companyId = req.companyId;
        if (!companyId) {
            res.status(401).json({ error: 'Company not found' });
            return;
        }
        const snapshot = await db
            .collection('boards')
            .where('companyId', '==', companyId)
            .orderBy('createdAt', 'desc')
            .get();
        const boards = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: data.id,
                name: data.name,
                slug: data.slug,
                description: data.description,
                categories: data.categories,
                createdAt: data.createdAt?.toDate?.()?.toISOString(),
            };
        });
        res.json({ boards, total: boards.length });
    }
    catch (error) {
        console.error('List boards error:', error);
        res.status(500).json({ error: 'Failed to list boards' });
    }
});
router.patch('/api/boards/:id', (0, auth_1.hasPermission)(['boards:write']), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, categories, isAnonymousAllowed } = req.body;
        const updateData = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (name) {
            updateData.name = name;
            updateData.slug = slugify(name);
        }
        if (description !== undefined)
            updateData.description = description;
        if (categories)
            updateData.categories = categories;
        if (isAnonymousAllowed !== undefined)
            updateData.isAnonymousAllowed = isAnonymousAllowed;
        const boardDoc = await db.collection('boards').doc(id).get();
        if (!boardDoc.exists) {
            res.status(404).json({ error: 'Board not found' });
            return;
        }
        await boardDoc.ref.update(updateData);
        const updated = { ...(await boardDoc.ref.get()).data() };
        res.json({
            id: updated.id,
            name: updated.name,
            slug: updated.slug,
            updatedAt: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Update board error:', error);
        res.status(500).json({ error: 'Failed to update board' });
    }
});
router.delete('/api/boards/:id', (0, auth_1.hasPermission)(['boards:delete']), async (req, res) => {
    try {
        const { id } = req.params;
        const boardDoc = await db.collection('boards').doc(id).get();
        if (!boardDoc.exists) {
            res.status(404).json({ error: 'Board not found' });
            return;
        }
        await boardDoc.ref.delete();
        res.status(204).send();
    }
    catch (error) {
        console.error('Delete board error:', error);
        res.status(500).json({ error: 'Failed to delete board' });
    }
});
exports.default = router;
//# sourceMappingURL=boards.js.map