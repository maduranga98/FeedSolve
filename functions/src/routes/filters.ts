import * as admin from 'firebase-admin';
import { Router, Response } from 'express';
import { AuthenticatedRequest, hasPermission } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const db = admin.firestore();

router.post(
  '/api/filters',
  hasPermission(['submissions:read']),
  async (req: AuthenticatedRequest, res: Response) => {
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

      const filterId = uuidv4();
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
    } catch (error) {
      console.error('Create filter error:', error);
      res.status(500).json({ error: 'Failed to create filter' });
    }
  }
);

router.get(
  '/api/filters',
  hasPermission(['submissions:read']),
  async (req: AuthenticatedRequest, res: Response) => {
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
    } catch (error) {
      console.error('List filters error:', error);
      res.status(500).json({ error: 'Failed to list filters' });
    }
  }
);

router.put(
  '/api/filters/:id',
  hasPermission(['submissions:read']),
  async (req: AuthenticatedRequest, res: Response) => {
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
    } catch (error) {
      console.error('Update filter error:', error);
      res.status(500).json({ error: 'Failed to update filter' });
    }
  }
);

router.delete(
  '/api/filters/:id',
  hasPermission(['submissions:read']),
  async (req: AuthenticatedRequest, res: Response) => {
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
    } catch (error) {
      console.error('Delete filter error:', error);
      res.status(500).json({ error: 'Failed to delete filter' });
    }
  }
);

router.patch(
  '/api/filters/:id/pin',
  hasPermission(['submissions:read']),
  async (req: AuthenticatedRequest, res: Response) => {
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
    } catch (error) {
      console.error('Update pin status error:', error);
      res.status(500).json({ error: 'Failed to update pin status' });
    }
  }
);

export default router;
