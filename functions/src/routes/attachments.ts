import * as admin from 'firebase-admin';
import { Router, Response } from 'express';
import { AuthenticatedRequest, hasPermission } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const db = admin.firestore();
const bucket = admin.storage().bucket();

const ATTACHMENT_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB per file
  maxSubmissionSize: 20 * 1024 * 1024, // 20MB per submission
  allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'xlsx'],
  tierLimits: {
    free: 5 * 1024 * 1024,
    starter: 50 * 1024 * 1024,
    growth: 500 * 1024 * 1024,
    business: 5 * 1024 * 1024 * 1024,
  },
};

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

function isValidFileType(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ATTACHMENT_CONFIG.allowedFileTypes.includes(ext);
}

async function checkStorageQuota(companyId: string, additionalBytes: number): Promise<boolean> {
  const companyDoc = await db.collection('companies').doc(companyId).get();
  if (!companyDoc.exists) return false;

  const company = companyDoc.data();
  const tier = company?.subscription?.tier || 'free';
  const limit = ATTACHMENT_CONFIG.tierLimits[tier as keyof typeof ATTACHMENT_CONFIG.tierLimits];

  const usage = company?.usage?.storage?.usedBytes || 0;
  return usage + additionalBytes <= limit;
}

async function updateStorageUsage(companyId: string, bytes: number): Promise<void> {
  await db.collection('companies').doc(companyId).update({
    'usage.storage.usedBytes': admin.firestore.FieldValue.increment(bytes),
    'usage.storage.lastResetAt': admin.firestore.FieldValue.serverTimestamp(),
  });
}

router.post('/api/submissions/:submissionId/attachments', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { filename, filetype, filesize, base64data } = req.body;

    if (!submissionId || !filename || !filetype || !filesize || !base64data) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Validate file
    if (!isValidFileType(filename)) {
      res.status(400).json({ error: 'File type not allowed' });
      return;
    }

    if (filesize > ATTACHMENT_CONFIG.maxFileSize) {
      res.status(400).json({ error: 'File exceeds max size' });
      return;
    }

    // Get submission and check access
    const submissionDoc = await db.collection('submissions').doc(submissionId).get();
    if (!submissionDoc.exists) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    const submission = submissionDoc.data();
    const { companyId } = submission;

    // Check if user is in company and has permission
    if (!hasPermission(req, companyId, 'submissions:write')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Check storage quota
    const hasQuota = await checkStorageQuota(companyId, filesize);
    if (!hasQuota) {
      res.status(402).json({ error: 'Storage quota exceeded' });
      return;
    }

    // Check submission size
    const submissionAttachments = submission.attachments || [];
    const submissionSize = submissionAttachments.reduce((sum: number, att: any) => sum + att.fileSize, 0);
    if (submissionSize + filesize > ATTACHMENT_CONFIG.maxSubmissionSize) {
      res.status(400).json({ error: 'Submission size limit exceeded' });
      return;
    }

    // Upload to Firebase Storage
    const attachmentId = uuidv4();
    const storagePath = `attachments/${companyId}/${submissionId}/${attachmentId}`;
    const file = bucket.file(storagePath);

    const buffer = Buffer.from(base64data, 'base64');
    await file.save(buffer, { contentType: filetype });

    // Create attachment record
    const attachment = {
      id: attachmentId,
      filename,
      fileType: filetype,
      fileSize: filesize,
      storagePath,
      uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
      uploadedBy: req.auth?.uid || 'unknown',
      scanned: false,
      scanStatus: 'pending',
    };

    // Add attachment to submission
    await db.collection('submissions').doc(submissionId).update({
      attachments: admin.firestore.FieldValue.arrayUnion(attachment),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update storage usage
    await updateStorageUsage(companyId, filesize);

    res.status(201).json({
      id: attachmentId,
      filename,
      fileSize: filesize,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.get('/api/submissions/:submissionId/attachments/:attachmentId/download', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId, attachmentId } = req.params;

    // Get submission
    const submissionDoc = await db.collection('submissions').doc(submissionId).get();
    if (!submissionDoc.exists) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    const submission = submissionDoc.data();
    const attachment = submission.attachments?.find((a: any) => a.id === attachmentId);

    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    // Check access - company members can download
    if (!hasPermission(req, submission.companyId, 'submissions:read')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Generate signed URL
    const [url] = await bucket.file(attachment.storagePath).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 3600 * 1000, // 1 hour
    });

    res.json({ url, filename: attachment.filename });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

router.delete('/api/submissions/:submissionId/attachments/:attachmentId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId, attachmentId } = req.params;

    // Get submission
    const submissionDoc = await db.collection('submissions').doc(submissionId).get();
    if (!submissionDoc.exists) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    const submission = submissionDoc.data();
    const attachment = submission.attachments?.find((a: any) => a.id === attachmentId);

    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    // Check permission - manage submissions required
    if (!hasPermission(req, submission.companyId, 'submissions:write')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Delete from storage
    await bucket.file(attachment.storagePath).delete().catch(() => {
      // File might not exist, continue anyway
    });

    // Remove from submission
    await db.collection('submissions').doc(submissionId).update({
      attachments: admin.firestore.FieldValue.arrayRemove(attachment),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update storage usage
    await updateStorageUsage(submission.companyId, -attachment.fileSize);

    res.json({ message: 'Attachment deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

export default router;
