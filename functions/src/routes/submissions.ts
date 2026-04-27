import * as admin from 'firebase-admin';
import { Router, Request, Response } from 'express';
import { AuthenticatedRequest, hasPermission } from '../middleware/auth';
import { submissionRateLimitMiddleware } from '../middleware/rateLimit';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const db = admin.firestore();

const SUBJECT_MAX = 100;
const DESCRIPTION_MAX = 5000;

function log(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>) {
  console[level](JSON.stringify({ severity: level.toUpperCase(), message, ...data }));
}

// Generates #FSV-XXXX with exactly 4 uppercase alphanumeric characters.
function generateTrackingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '#FSV-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
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

// Validate tracking code format: #FSV-<exactly 4 uppercase alphanumeric chars>
function isValidTrackingCode(code: string): boolean {
  return /^#FSV-[A-Z0-9]{4}$/i.test(code);
}

async function isTrackingCodeUnique(code: string): Promise<boolean> {
  const snapshot = await db
    .collection('submissions')
    .where('trackingCode', '==', code)
    .limit(1)
    .get();
  return snapshot.empty;
}

router.post(
  '/api/submissions',
  submissionRateLimitMiddleware,
  async (req: Request, res: Response) => {
    const start = Date.now();
    try {
      const { boardId, category, email, isAnonymous } = req.body;

      const subject = sanitizeText(req.body.subject, SUBJECT_MAX);
      const description = sanitizeText(req.body.description, DESCRIPTION_MAX);

      if (!boardId || typeof boardId !== 'string' || boardId.length > 128) {
        res.status(400).json({ error: 'Invalid boardId' });
        return;
      }

      if (!subject) {
        res.status(400).json({ error: 'subject is required' });
        return;
      }

      if (subject.length > SUBJECT_MAX) {
        res.status(400).json({ error: `subject must be at most ${SUBJECT_MAX} characters` });
        return;
      }

      if (!description) {
        res.status(400).json({ error: 'description is required' });
        return;
      }

      if (description.length > DESCRIPTION_MAX) {
        res.status(400).json({ error: `description must be at most ${DESCRIPTION_MAX} characters` });
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

      const boardData = boardDoc.data()!;
      const companyId = boardData.companyId;

      if (!companyId) {
        res.status(400).json({ error: 'Invalid board configuration' });
        return;
      }

      // Validate category against the board's allowed list
      const allowedCategories: string[] = boardData.categories || [];
      const sanitizedCategory = sanitizeText(category, 100);
      if (allowedCategories.length > 0 && !allowedCategories.includes(sanitizedCategory)) {
        res.status(400).json({
          error: 'Invalid category',
          allowed: allowedCategories,
        });
        return;
      }

      // Generate a unique tracking code (collision probability ~1:1.6M per attempt)
      let trackingCode = generateTrackingCode();
      let attempts = 0;
      while (!(await isTrackingCodeUnique(trackingCode)) && attempts < 5) {
        trackingCode = generateTrackingCode();
        attempts++;
      }

      const submissionId = uuidv4();

      const submission = {
        id: submissionId,
        boardId,
        companyId,
        trackingCode,
        category: sanitizedCategory || (allowedCategories[0] ?? 'General'),
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

      log('info', 'Submission created', {
        submissionId,
        boardId,
        companyId,
        trackingCode,
        durationMs: Date.now() - start,
      });

      res.status(201).json({
        id: submissionId,
        trackingCode,
        status: 'received',
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      log('error', 'Create submission error', { error: String(error), durationMs: Date.now() - start });
      res.status(500).json({ error: 'Failed to create submission' });
    }
  }
);

router.get('/api/submissions/:id', async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const { id } = req.params;
    const normalizedId = id.startsWith('#') ? id : `#${id}`;

    if (!isValidTrackingCode(normalizedId)) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    const snapshot = await db
      .collection('submissions')
      .where('trackingCode', '==', normalizedId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    const submission = snapshot.docs[0].data();

    log('info', 'Submission fetched by tracking code', {
      trackingCode: normalizedId,
      durationMs: Date.now() - start,
    });

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
    log('error', 'Get submission error', { error: String(error), durationMs: Date.now() - start });
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
      log('error', 'List submissions error', { error: String(error) });
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
        // resolvedAt is set only when transitioning to 'resolved' (not 'closed')
        if (status === 'resolved') {
          updateData.resolvedAt = admin.firestore.FieldValue.serverTimestamp();
        }
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

      log('info', 'Submission updated', { submissionId: id, status, priority });

      res.json({
        id: updated.id,
        trackingCode: updated.trackingCode,
        status: updated.status,
        priority: updated.priority,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      log('error', 'Update submission error', { error: String(error) });
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

      log('info', 'Submission deleted', { submissionId: id });

      res.status(204).send();
    } catch (error) {
      log('error', 'Delete submission error', { error: String(error) });
      res.status(500).json({ error: 'Failed to delete submission' });
    }
  }
);

export default router;
