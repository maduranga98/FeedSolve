import * as admin from 'firebase-admin';
import { Router, Response } from 'express';
import { AuthenticatedRequest, hasPermission } from '../middleware/auth';
import { generateApiKey } from '../utils/apiKeyGenerator';

const router = Router();
const db = admin.firestore();

router.post(
  '/api/auth/api-keys',
  hasPermission(['keys:create']),
  async (req: AuthenticatedRequest, res: Response) => {
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

      const { id, key, keyDisplay, keyHash } = generateApiKey();

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
    } catch (error) {
      console.error('Create API key error:', error);
      res.status(500).json({ error: 'Failed to create API key' });
    }
  }
);

router.get(
  '/api/auth/api-keys',
  hasPermission(['keys:read']),
  async (req: AuthenticatedRequest, res: Response) => {
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
    } catch (error) {
      console.error('List API keys error:', error);
      res.status(500).json({ error: 'Failed to list API keys' });
    }
  }
);

router.delete(
  '/api/auth/api-keys/:keyId',
  hasPermission(['keys:delete']),
  async (req: AuthenticatedRequest, res: Response) => {
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
    } catch (error) {
      console.error('Delete API key error:', error);
      res.status(500).json({ error: 'Failed to delete API key' });
    }
  }
);

export default router;
