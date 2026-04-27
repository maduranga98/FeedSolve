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
const BOARD_NAME_MAX = 100;
const CATEGORY_NAME_MAX = 100;
// Board limits per subscription tier
const TIER_BOARD_LIMITS = {
    free: 3,
    starter: 10,
    growth: 25,
    business: Infinity,
};
function log(level, message, data) {
    console[level](JSON.stringify({ severity: level.toUpperCase(), message, ...data }));
}
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 120);
}
router.post('/api/boards', (0, auth_1.hasPermission)(['boards:create']), async (req, res) => {
    const start = Date.now();
    try {
        const { name, description, categories, isAnonymousAllowed } = req.body;
        const companyId = req.companyId;
        if (!companyId) {
            res.status(401).json({ error: 'Company not found' });
            return;
        }
        if (!name || typeof name !== 'string' || !name.trim()) {
            res.status(400).json({ error: 'Board name is required' });
            return;
        }
        const trimmedName = name.trim();
        if (trimmedName.length > BOARD_NAME_MAX) {
            res.status(400).json({
                error: `Board name must be at most ${BOARD_NAME_MAX} characters`,
            });
            return;
        }
        // Validate categories
        if (categories !== undefined) {
            if (!Array.isArray(categories)) {
                res.status(400).json({ error: 'categories must be an array' });
                return;
            }
            for (const cat of categories) {
                if (typeof cat !== 'string' || cat.trim().length === 0) {
                    res.status(400).json({ error: 'Each category must be a non-empty string' });
                    return;
                }
                if (cat.trim().length > CATEGORY_NAME_MAX) {
                    res.status(400).json({
                        error: `Category names must be at most ${CATEGORY_NAME_MAX} characters`,
                    });
                    return;
                }
            }
        }
        // Check company's subscription tier and board limit
        const companyDoc = await db.collection('companies').doc(companyId).get();
        if (!companyDoc.exists) {
            res.status(404).json({ error: 'Company not found' });
            return;
        }
        const companyData = companyDoc.data();
        const tier = companyData.subscription?.tier ?? 'free';
        const boardLimit = TIER_BOARD_LIMITS[tier] ?? TIER_BOARD_LIMITS.free;
        // Count existing boards for this company
        const boardCountSnapshot = await db
            .collection('boards')
            .where('companyId', '==', companyId)
            .count()
            .get();
        const currentBoardCount = boardCountSnapshot.data().count;
        if (currentBoardCount >= boardLimit) {
            log('warn', 'Board limit reached', { companyId, tier, limit: boardLimit, current: currentBoardCount });
            res.status(403).json({
                error: `Your ${tier} plan allows a maximum of ${boardLimit} board${boardLimit === 1 ? '' : 's'}. Please upgrade to create more.`,
                code: 'BOARD_LIMIT_REACHED',
            });
            return;
        }
        // Enforce board name uniqueness per company
        const nameConflictSnapshot = await db
            .collection('boards')
            .where('companyId', '==', companyId)
            .where('name', '==', trimmedName)
            .limit(1)
            .get();
        if (!nameConflictSnapshot.empty) {
            res.status(409).json({
                error: 'A board with this name already exists in your workspace',
                code: 'BOARD_NAME_CONFLICT',
            });
            return;
        }
        const boardId = (0, uuid_1.v4)();
        const slug = slugify(trimmedName);
        const board = {
            id: boardId,
            companyId,
            name: trimmedName,
            description: typeof description === 'string' ? description.substring(0, 500) : '',
            slug,
            categories: Array.isArray(categories)
                ? categories.map((c) => c.trim()).filter(Boolean)
                : [],
            isAnonymousAllowed: isAnonymousAllowed !== false,
            qrCodeUrl: `https://feedsolve.com/b/${slug}`,
            submissionCount: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection('boards').doc(boardId).set(board);
        // Increment company boardCount
        await companyDoc.ref.update({
            boardCount: admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        log('info', 'Board created', {
            boardId,
            companyId,
            tier,
            durationMs: Date.now() - start,
        });
        res.status(201).json({
            id: boardId,
            name: trimmedName,
            slug,
            qrCodeUrl: board.qrCodeUrl,
            createdAt: new Date().toISOString(),
        });
    }
    catch (error) {
        log('error', 'Create board error', { error: String(error), durationMs: Date.now() - start });
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
        log('error', 'Get board error', { error: String(error) });
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
        log('error', 'List boards error', { error: String(error) });
        res.status(500).json({ error: 'Failed to list boards' });
    }
});
router.patch('/api/boards/:id', (0, auth_1.hasPermission)(['boards:write']), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, categories, isAnonymousAllowed } = req.body;
        const companyId = req.companyId;
        const updateData = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (name !== undefined) {
            const trimmedName = typeof name === 'string' ? name.trim() : '';
            if (!trimmedName) {
                res.status(400).json({ error: 'Board name cannot be empty' });
                return;
            }
            if (trimmedName.length > BOARD_NAME_MAX) {
                res.status(400).json({ error: `Board name must be at most ${BOARD_NAME_MAX} characters` });
                return;
            }
            // Check uniqueness within the company (exclude current board)
            if (companyId) {
                const nameConflict = await db
                    .collection('boards')
                    .where('companyId', '==', companyId)
                    .where('name', '==', trimmedName)
                    .limit(1)
                    .get();
                if (!nameConflict.empty && nameConflict.docs[0].id !== id) {
                    res.status(409).json({
                        error: 'A board with this name already exists in your workspace',
                        code: 'BOARD_NAME_CONFLICT',
                    });
                    return;
                }
            }
            updateData.name = trimmedName;
            updateData.slug = slugify(trimmedName);
        }
        if (description !== undefined) {
            updateData.description = typeof description === 'string' ? description.substring(0, 500) : '';
        }
        if (categories !== undefined) {
            if (!Array.isArray(categories)) {
                res.status(400).json({ error: 'categories must be an array' });
                return;
            }
            updateData.categories = categories.map((c) => String(c).trim()).filter(Boolean);
        }
        if (isAnonymousAllowed !== undefined) {
            updateData.isAnonymousAllowed = Boolean(isAnonymousAllowed);
        }
        const boardDoc = await db.collection('boards').doc(id).get();
        if (!boardDoc.exists) {
            res.status(404).json({ error: 'Board not found' });
            return;
        }
        await boardDoc.ref.update(updateData);
        const updated = { ...(await boardDoc.ref.get()).data() };
        log('info', 'Board updated', { boardId: id });
        res.json({
            id: updated.id,
            name: updated.name,
            slug: updated.slug,
            updatedAt: new Date().toISOString(),
        });
    }
    catch (error) {
        log('error', 'Update board error', { error: String(error) });
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
        const companyId = boardDoc.data()?.companyId;
        await boardDoc.ref.delete();
        // Decrement company boardCount
        if (companyId) {
            await db.collection('companies').doc(companyId).update({
                boardCount: admin.firestore.FieldValue.increment(-1),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        log('info', 'Board deleted', { boardId: id, companyId });
        res.status(204).send();
    }
    catch (error) {
        log('error', 'Delete board error', { error: String(error) });
        res.status(500).json({ error: 'Failed to delete board' });
    }
});
exports.default = router;
//# sourceMappingURL=boards.js.map