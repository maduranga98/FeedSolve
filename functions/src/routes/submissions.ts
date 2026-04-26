import * as admin from 'firebase-admin';
import { Router, Request, Response } from 'express';
import { AuthenticatedRequest, hasPermission } from '../middleware/auth';
import { submissionRateLimitMiddleware } from '../middleware/rateLimit';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const db = admin.firestore();

function generateTrackingCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `#FSV-${timestamp}${random}`;
}

// Strip HTML tags and dangerous patterns before storing user-supplied text.
// React escapes output by default; this provides defence-in-depth for
// webhooks, emails, and any non-React consumers of the stored data.
function sanitizeText(input: unknown, maxLength: number): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
    .substring(0, maxLength);
}

function isValidEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

// Validate tracking code format: #FSV-<8-30 uppercase alphanumeric chars>
function isValidTrackingCode(code: string): boolean {
  return /^#FSV-[A-Z0-9]{8,30}$/.test(code);
}

router.post(
  '/api/submissions',
  submissionRateLimitMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { boardId, category, email, isAnonymous } = req.body;

      // Sanitize and validate user-supplied text fields
      const subject = sanitizeText(req.body.subject, 500);
      const description = sanitizeText(req.body.description, 10000);

      if (!boardId || typeof boardId !== 'string' || boardId.length > 128) {
        res.status(400).json({ error: 'Invalid boardId' });
        return;
      }

      if (!subject) {
        res.status(400).json({ error: 'subject is required' });
        return;
      }

      if (!description) {
        res.status(400).json({ error: 'description is required' });
        return;
      }

      if (email && !isAnonymous && !isValidEmail(email)) {
        res.status(400).json({ error: 'Invalid email address' });
        return;
      }

      const boardDoc = await db.collection('boards').doc(boardId).get();
      if (!boardDoc.exists) {
        res.status(404).json({ error: 'Board not found' });
        return;
      }

      const boardData = boardDoc.data();
      const companyId = boardData?.companyId;

      if (!companyId) {
        res.status(400).json({ error: 'Invalid board configuration' });
        return;
      }

      const trackingCode = generateTrackingCode();
      const submissionId = uuidv4();
      const sanitizedCategory = sanitizeText(category, 100) || 'General';

      const submission = {
        id: submissionId,
        boardId,
        companyId,
        trackingCode,
        category: sanitizedCategory,
        subject,
        description,
        email: isAnonymous ? null : (email || null),
        isAnonymous: isAnonymous === true,
        status: 'received',
        priority: 'medium',
        publicReply: null,
        internalNotes: null,
        attachments: [],
        assignedTo: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

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
  }
);

router.get('/api/submissions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate tracking code format before hitting Firestore
    if (!isValidTrackingCode(id)) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    const snapshot = await db
      .collection('submissions')
      .where('trackingCode', '==', id)
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    const submission = snapshot.docs[0].data();

    res.json({
      id: submission.id,
      trackingCode: submission.trackingCode,
      status: submission.status,
      category: submission.category,
      subject: submission.subject,
      description: submission.description,
      publicReply: submission.publicReply,
      createdAt: submission.createdAt?.toDate?.()?.toISOString(),
      updatedAt: submission.updatedAt?.toDate?.()?.toISOString(),
    });
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

      res.json({ submissions, total, limit: limitNum, offset: offsetNum });
    } catch (error) {
      console.error('List submissions error:', error);
      res.status(500).json({ error: 'Failed to list submissions' });
    }
  }
);

const ALLOWED_STATUSES = new Set(['received', 'in_review', 'in_progress', 'resolved', 'closed']);
const ALLOWED_PRIORITIES = new Set(['low', 'medium', 'high', 'critical']);

router.patch(
  '/api/submissions/:id',
  hasPermission(['submissions:write']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status, priority, assignedTo, publicReply, internalNotes } = req.body;

      const updateData: Record<string, unknown> = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (status !== undefined) {
        if (!ALLOWED_STATUSES.has(status)) {
          res.status(400).json({ error: 'Invalid status value' });
          return;
        }
        updateData.status = status;
      }

      if (priority !== undefined) {
        if (!ALLOWED_PRIORITIES.has(priority)) {
          res.status(400).json({ error: 'Invalid priority value' });
          return;
        }
        updateData.priority = priority;
      }

      if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
      if (publicReply !== undefined) updateData.publicReply = sanitizeText(publicReply, 5000);
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

      const updated = (await submissionDoc.ref.get()).data()!;

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

      await snapshot.docs[0].ref.delete();

      res.status(204).send();
    } catch (error) {
      console.error('Delete submission error:', error);
      res.status(500).json({ error: 'Failed to delete submission' });
    }
  }
);

export default router;
