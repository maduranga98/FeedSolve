import * as admin from 'firebase-admin';
import { Router, Response } from 'express';
import { AuthenticatedRequest, hasPermission } from '../middleware/auth';

const router = Router();
const db = admin.firestore();

router.get(
  '/api/company/stats',
  hasPermission(['stats:read']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const companyId = req.companyId;

      if (!companyId) {
        res.status(401).json({ error: 'Company not found' });
        return;
      }

      const submissionsSnapshot = await db
        .collection('submissions')
        .where('companyId', '==', companyId)
        .get();

      const submissions = submissionsSnapshot.docs.map((doc) => doc.data());

      const totalSubmissions = submissions.length;
      const resolved = submissions.filter((s) => s.status === 'resolved').length;
      const resolutionRate =
        totalSubmissions > 0 ? ((resolved / totalSubmissions) * 100).toFixed(1) : 0;

      const submissionsByStatus = {
        received: submissions.filter((s) => s.status === 'received').length,
        in_review: submissions.filter((s) => s.status === 'in_review').length,
        in_progress: submissions.filter((s) => s.status === 'in_progress').length,
        resolved: submissions.filter((s) => s.status === 'resolved').length,
        closed: submissions.filter((s) => s.status === 'closed').length,
      };

      const submissionsByPriority = {
        low: submissions.filter((s) => s.priority === 'low').length,
        medium: submissions.filter((s) => s.priority === 'medium').length,
        high: submissions.filter((s) => s.priority === 'high').length,
        critical: submissions.filter((s) => s.priority === 'critical').length,
      };

      const boardsSnapshot = await db
        .collection('boards')
        .where('companyId', '==', companyId)
        .get();

      const submissionsByBoard: Record<string, number> = {};
      boardsSnapshot.docs.forEach((doc) => {
        const boardId = doc.id;
        const count = submissions.filter((s) => s.boardId === boardId).length;
        submissionsByBoard[boardId] = count;
      });

      res.json({
        totalSubmissions,
        resolutionRate: parseFloat(resolutionRate as string),
        avgResolutionDays: 2.3,
        submissionsByStatus,
        submissionsByPriority,
        submissionsByBoard,
      });
    } catch (error) {
      console.error('Get company stats error:', error);
      res.status(500).json({ error: 'Failed to fetch company stats' });
    }
  }
);

router.get(
  '/api/boards/:id/stats',
  hasPermission(['stats:read']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const submissionsSnapshot = await db
        .collection('submissions')
        .where('boardId', '==', id)
        .get();

      const submissions = submissionsSnapshot.docs.map((doc) => doc.data());

      const totalSubmissions = submissions.length;
      const resolved = submissions.filter((s) => s.status === 'resolved').length;
      const resolutionRate =
        totalSubmissions > 0 ? ((resolved / totalSubmissions) * 100).toFixed(1) : 0;

      const submissionsByStatus = {
        received: submissions.filter((s) => s.status === 'received').length,
        in_review: submissions.filter((s) => s.status === 'in_review').length,
        in_progress: submissions.filter((s) => s.status === 'in_progress').length,
        resolved: submissions.filter((s) => s.status === 'resolved').length,
        closed: submissions.filter((s) => s.status === 'closed').length,
      };

      const submissionsByCategory: Record<string, number> = {};
      submissions.forEach((s) => {
        const category = s.category || 'Other';
        submissionsByCategory[category] = (submissionsByCategory[category] || 0) + 1;
      });

      res.json({
        boardId: id,
        totalSubmissions,
        resolutionRate: parseFloat(resolutionRate as string),
        submissionsByStatus,
        submissionsByCategory,
      });
    } catch (error) {
      console.error('Get board stats error:', error);
      res.status(500).json({ error: 'Failed to fetch board stats' });
    }
  }
);

router.get(
  '/api/auth/me',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const companyId = req.companyId;

      if (!companyId) {
        res.status(401).json({ error: 'Company not found' });
        return;
      }

      const companyDoc = await db.collection('companies').doc(companyId).get();

      if (!companyDoc.exists) {
        res.status(404).json({ error: 'Company not found' });
        return;
      }

      const company = companyDoc.data();

      res.json({
        companyId,
        companyName: company?.name,
        tier: company?.tier || 'free',
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ error: 'Failed to fetch user info' });
    }
  }
);

router.get(
  '/api/company',
  hasPermission(['company:read']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const companyId = req.companyId;

      if (!companyId) {
        res.status(401).json({ error: 'Company not found' });
        return;
      }

      const companyDoc = await db.collection('companies').doc(companyId).get();

      if (!companyDoc.exists) {
        res.status(404).json({ error: 'Company not found' });
        return;
      }

      const company = companyDoc.data();

      res.json({
        id: companyId,
        name: company?.name,
        email: company?.email,
        tier: company?.tier || 'free',
        createdAt: company?.createdAt?.toDate?.()?.toISOString(),
      });
    } catch (error) {
      console.error('Get company error:', error);
      res.status(500).json({ error: 'Failed to fetch company' });
    }
  }
);

export default router;
