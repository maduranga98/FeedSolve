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
const apiKeyGenerator_1 = require("../utils/apiKeyGenerator");
const router = (0, express_1.Router)();
const db = admin.firestore();
router.post('/api/auth/api-keys', (0, auth_1.hasPermission)(['keys:create']), async (req, res) => {
    try {
        const { name, permissions, expiresAt, ipWhitelist } = req.body;
        const companyId = req.companyId;
        if (!companyId) {
            res.status(401).json({ error: 'Company not found' });
            return;
        }
        if (!name || !Array.isArray(permissions)) {
            res.status(400).json({
                error: 'Invalid input',
                required: ['name', 'permissions (array)'],
            });
            return;
        }
        const { id, key, keyDisplay, keyHash } = (0, apiKeyGenerator_1.generateApiKey)();
        const keyData = {
            id,
            companyId,
            name,
            keyHash,
            keyDisplay,
            permissions,
            rateLimit: {
                requestsPerMonth: 10000,
                currentMonthUsage: 0,
                lastResetAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            ipWhitelist: ipWhitelist || [],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastUsedAt: null,
            expiresAt: expiresAt ? admin.firestore.Timestamp.fromDate(new Date(expiresAt)) : null,
        };
        await db
            .collection('api_keys')
            .doc(companyId)
            .collection('keys')
            .doc(id)
            .set(keyData);
        res.status(201).json({
            id,
            key,
            keyDisplay,
            name,
            permissions,
            createdAt: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Create API key error:', error);
        res.status(500).json({ error: 'Failed to create API key' });
    }
});
router.get('/api/auth/api-keys', (0, auth_1.hasPermission)(['keys:read']), async (req, res) => {
    try {
        const companyId = req.companyId;
        if (!companyId) {
            res.status(401).json({ error: 'Company not found' });
            return;
        }
        const snapshot = await db
            .collection('api_keys')
            .doc(companyId)
            .collection('keys')
            .orderBy('createdAt', 'desc')
            .get();
        const keys = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: data.id,
                keyDisplay: data.keyDisplay,
                name: data.name,
                permissions: data.permissions,
                createdAt: data.createdAt?.toDate?.()?.toISOString(),
                lastUsedAt: data.lastUsedAt?.toDate?.()?.toISOString() || null,
                expiresAt: data.expiresAt?.toDate?.()?.toISOString() || null,
            };
        });
        res.json({ keys, total: keys.length });
    }
    catch (error) {
        console.error('List API keys error:', error);
        res.status(500).json({ error: 'Failed to list API keys' });
    }
});
router.delete('/api/auth/api-keys/:keyId', (0, auth_1.hasPermission)(['keys:delete']), async (req, res) => {
    try {
        const { keyId } = req.params;
        const companyId = req.companyId;
        if (!companyId) {
            res.status(401).json({ error: 'Company not found' });
            return;
        }
        await db
            .collection('api_keys')
            .doc(companyId)
            .collection('keys')
            .doc(keyId)
            .delete();
        res.status(204).send();
    }
    catch (error) {
        console.error('Delete API key error:', error);
        res.status(500).json({ error: 'Failed to delete API key' });
    }
});
exports.default = router;
//# sourceMappingURL=apiKeys.js.map