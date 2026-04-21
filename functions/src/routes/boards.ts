import * as admin from 'firebase-admin';
import { Router, Response } from 'express';
import { AuthenticatedRequest, hasPermission } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const db = admin.firestore();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

router.post(
  '/api/boards',
  hasPermission(['boards:create']),
  async (req: AuthenticatedRequest, res: Response) => {
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

      const boardId = uuidv4();
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
    } catch (error) {
      console.error('Create board error:', error);
      res.status(500).json({ error: 'Failed to create board' });
    }
  }
);

router.get('/api/boards/:id', async (req: AuthenticatedRequest, res: Response) => {
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
  } catch (error) {
    console.error('Get board error:', error);
    res.status(500).json({ error: 'Failed to fetch board' });
  }
});

router.get(
  '/api/company/boards',
  hasPermission(['boards:read']),
  async (req: AuthenticatedRequest, res: Response) => {
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
    } catch (error) {
      console.error('List boards error:', error);
      res.status(500).json({ error: 'Failed to list boards' });
    }
  }
);

router.patch(
  '/api/boards/:id',
  hasPermission(['boards:write']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, categories, isAnonymousAllowed } = req.body;

      const updateData: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (name) {
        updateData.name = name;
        updateData.slug = slugify(name);
      }
      if (description !== undefined) updateData.description = description;
      if (categories) updateData.categories = categories;
      if (isAnonymousAllowed !== undefined) updateData.isAnonymousAllowed = isAnonymousAllowed;

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
    } catch (error) {
      console.error('Update board error:', error);
      res.status(500).json({ error: 'Failed to update board' });
    }
  }
);

router.delete(
  '/api/boards/:id',
  hasPermission(['boards:delete']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const boardDoc = await db.collection('boards').doc(id).get();

      if (!boardDoc.exists) {
        res.status(404).json({ error: 'Board not found' });
        return;
      }

      await boardDoc.ref.delete();

      res.status(204).send();
    } catch (error) {
      console.error('Delete board error:', error);
      res.status(500).json({ error: 'Failed to delete board' });
    }
  }
);

export default router;
