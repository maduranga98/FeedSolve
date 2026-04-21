import * as admin from 'firebase-admin';
import { Router, Response } from 'express';
import { AuthenticatedRequest, hasPermission } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const db = admin.firestore();

function generateTrackingCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `#FSV-${timestamp}${random}`;
}

router.post('/api/submissions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { boardId, category, subject, description, email, isAnonymous } = req.body;

    if (!boardId || !subject || !description) {
      res.status(400).json({
        error: 'Invalid input',
        required: ['boardId', 'subject', 'description'],
      });
      return;
    }

    const trackingCode = generateTrackingCode();
    const submissionId = uuidv4();

    const submission = {
      id: submissionId,
      boardId,
      trackingCode,
      category: category || 'General',
      subject,
      description,
      email: isAnonymous ? null : email,
      isAnonymous: isAnonymous || false,
      status: 'received',
      priority: 'medium',
      publicReply: null,
      internalNotes: null,
      attachments: [],
      assignedTo: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const boardDoc = await db.collection('boards').doc(boardId).get();
    if (!boardDoc.exists) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    const boardData = boardDoc.data();
    const companyId = boardData?.companyId;

    if (!companyId) {
      res.status(400).json({ error: 'Invalid board' });
      return;
    }

    await db.collection('submissions').doc(submissionId).set(submission);

    res.status(201).json({
      id: submissionId,
      trackingCode,
      status: 'received',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Create submission error:', error);
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

router.get('/api/submissions/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const snapshot = await db
      .collection('submissions')
      .where('trackingCode', '==', id)
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    const submissionDoc = snapshot.docs[0];
    const submission = submissionDoc.data();

    const response = {
      id: submission.id,
      trackingCode: submission.trackingCode,
      status: submission.status,
      category: submission.category,
      subject: submission.subject,
      description: submission.description,
      publicReply: submission.publicReply,
      createdAt: submission.createdAt?.toDate?.()?.toISOString(),
      updatedAt: submission.updatedAt?.toDate?.()?.toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

router.get(
  '/api/company/submissions',
  hasPermission(['submissions:read']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const companyId = req.companyId;
      const { status, boardId, priority, limit = 10, offset = 0 } = req.query;

      if (!companyId) {
        res.status(401).json({ error: 'Company not found' });
        return;
      }

      let query: FirebaseFirestore.Query = db
        .collection('submissions')
        .where('companyId', '==', companyId);

      if (status) {
        query = query.where('status', '==', status);
      }

      if (boardId) {
        query = query.where('boardId', '==', boardId);
      }

      if (priority) {
        query = query.where('priority', '==', priority);
      }

      const totalSnapshot = await query.get();
      const total = totalSnapshot.size;

      const limitNum = Math.min(parseInt(limit as string) || 10, 100);
      const offsetNum = parseInt(offset as string) || 0;

      const snapshot = await query
        .orderBy('createdAt', 'desc')
        .limit(limitNum)
        .offset(offsetNum)
        .get();

      const submissions = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: data.id,
          trackingCode: data.trackingCode,
          status: data.status,
          category: data.category,
          subject: data.subject,
          priority: data.priority,
          createdAt: data.createdAt?.toDate?.()?.toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString(),
        };
      });

      res.json({
        submissions,
        total,
        limit: limitNum,
        offset: offsetNum,
      });
    } catch (error) {
      console.error('List submissions error:', error);
      res.status(500).json({ error: 'Failed to list submissions' });
    }
  }
);

router.patch(
  '/api/submissions/:id',
  hasPermission(['submissions:write']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status, priority, assignedTo, publicReply, internalNotes } = req.body;

      const updateData: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (status) updateData.status = status;
      if (priority) updateData.priority = priority;
      if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
      if (publicReply !== undefined) updateData.publicReply = publicReply;
      if (internalNotes !== undefined) updateData.internalNotes = internalNotes;

      const snapshot = await db
        .collection('submissions')
        .where('id', '==', id)
        .limit(1)
        .get();

      if (snapshot.empty) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      const submissionDoc = snapshot.docs[0];
      await submissionDoc.ref.update(updateData);

      const updated = { ...(await submissionDoc.ref.get()).data(), ...updateData };

      res.json({
        id: updated.id,
        trackingCode: updated.trackingCode,
        status: updated.status,
        priority: updated.priority,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Update submission error:', error);
      res.status(500).json({ error: 'Failed to update submission' });
    }
  }
);

router.delete(
  '/api/submissions/:id',
  hasPermission(['submissions:delete']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const snapshot = await db
        .collection('submissions')
        .where('id', '==', id)
        .limit(1)
        .get();

      if (snapshot.empty) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      const submissionDoc = snapshot.docs[0];
      await submissionDoc.ref.delete();

      res.status(204).send();
    } catch (error) {
      console.error('Delete submission error:', error);
      res.status(500).json({ error: 'Failed to delete submission' });
    }
  }
);

export default router;
