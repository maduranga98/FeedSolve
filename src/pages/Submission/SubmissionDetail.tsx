import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, History } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button, Badge, LoadingSpinner } from '../../components/Shared';
import { AttachmentGallery } from '../../components/Attachments';
import { useFileDownload } from '../../hooks/useFileDownload';
import {
  getSubmission,
  updateSubmissionStatus,
  updateSubmissionPriority,
  updateSubmissionAssignment,
  updateSubmissionPublicReply,
  getTeamMembers,
  addAuditLog,
} from '../../lib/firestore';
import { formatDate } from '../../lib/utils';
import { useEscalationRules } from '../../hooks/useEscalationRules';
import { InternalDiscussion } from '../../components/dashboard/InternalDiscussion';
import type { EscalationLog, Submission, TeamMember } from '../../types';

const SATISFACTION_CONFIG: Record<number, { emoji: string; color: string; bg: string }> = {
  1: { emoji: "😠", color: "#c0392b", bg: "#FDEDEC" },
  2: { emoji: "😕", color: "#E67E22", bg: "#FEF5E7" },
  3: { emoji: "😐", color: "#78716c", bg: "#f1ebe5" },
  4: { emoji: "😊", color: "#c0694a", bg: "#f5e6df" },
  5: { emoji: "😄", color: "#27AE60", bg: "#EBF9F1" },
};

function SatisfactionBadge({ score, label }: { score: number; label?: string }) {
  const cfg = SATISFACTION_CONFIG[score];
  if (!cfg) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px",
        borderRadius: 20,
        backgroundColor: cfg.bg,
        color: cfg.color,
        fontWeight: 600,
        fontSize: "0.875rem",
        border: `1px solid ${cfg.color}40`,
      }}
    >
      <span style={{ fontSize: "1.1rem" }}>{cfg.emoji}</span>
      {label || `Score ${score}`}
    </span>
  );
}

export function SubmissionDetail() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading: downloading, downloadFile, viewFile } = useFileDownload();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const { getEscalationLog } = useEscalationRules();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [escalationLog, setEscalationLog] = useState<EscalationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [publicReply, setPublicReply] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = useCallback(async () => {
    if (!submissionId || !user) return;
    try {
      setLoading(true);
      const [submissionData, members, logEntries] = await Promise.all([
        getSubmission(submissionId),
        getTeamMembers(user.companyId),
        getEscalationLog(submissionId),
      ]);

      if (!submissionData) {
        setError('Submission not found');
        return;
      }

      setSubmission(submissionData);
      setTeamMembers(members);
      setEscalationLog(logEntries);
      setPublicReply(submissionData.publicReply || '');
    } catch (err) {
      setError('Failed to load submission');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getEscalationLog, submissionId, user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  async function handleStatusChange(newStatus: Submission['status']) {
    if (!submission || !user) return;
    try {
      setUpdating(true);
      await updateSubmissionStatus(submission.id, newStatus);
      void addAuditLog(user.companyId, {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: `Changed status to "${newStatus}"`,
        resourceType: 'submission',
        resourceId: submission.id,
        resourceName: submission.subject,
        details: { from: submission.status, to: newStatus },
      });
      setSuccess('Status updated');
      setSubmission({ ...submission, status: newStatus });
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Failed to update status');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  }

  async function handlePriorityChange(newPriority: Submission['priority']) {
    if (!submission || !user) return;
    try {
      setUpdating(true);
      await updateSubmissionPriority(submission.id, newPriority);
      void addAuditLog(user.companyId, {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: `Changed priority to "${newPriority}"`,
        resourceType: 'submission',
        resourceId: submission.id,
        resourceName: submission.subject,
        details: { from: submission.priority, to: newPriority },
      });
      setSuccess('Priority updated');
      setSubmission({ ...submission, priority: newPriority });
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Failed to update priority');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  }

  async function handleAssignmentChange(userId?: string) {
    if (!submission || !user) return;
    try {
      setUpdating(true);
      await updateSubmissionAssignment(submission.id, userId);
      const assignedMember = teamMembers.find((member) => member.userId === userId);
      void addAuditLog(user.companyId, {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: userId ? `Assigned submission to ${assignedMember?.name ?? userId}` : 'Unassigned submission',
        resourceType: 'submission',
        resourceId: submission.id,
        resourceName: submission.subject,
        details: { from: submission.assignedTo ?? null, to: userId ?? null, assignedToName: assignedMember?.name ?? null },
      });
      setSuccess('Assignment updated');
      setSubmission({ ...submission, assignedTo: userId });
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Failed to update assignment');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  }

  async function handlePublicReplyChange() {
    if (!submission || !user) return;
    try {
      setUpdating(true);
      await updateSubmissionPublicReply(submission.id, publicReply);
      void addAuditLog(user.companyId, {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: submission.publicReply ? 'Updated public reply' : 'Added public reply',
        resourceType: 'submission',
        resourceId: submission.id,
        resourceName: submission.subject,
        details: { replyLength: publicReply.trim().length, hadPreviousReply: Boolean(submission.publicReply) },
      });
      setSuccess('Public reply updated');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Failed to update public reply');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  }

  if (!user || !submissionId) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!submission) {
    return (
      <main className="min-h-screen bg-color-bg">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-color-error mb-4">Submission not found</p>
            <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
          </div>
        </div>
      </main>
    );
  }

  const assignedMember = teamMembers.find((m) => m.userId === submission.assignedTo);

  return (
    <main className="min-h-screen bg-color-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/submissions')}
          className="flex items-center gap-2 text-color-accent hover:text-color-primary mb-6 font-medium"
        >
          <ArrowLeft size={20} />
          Back to Submissions
        </button>

        <div className="bg-color-surface rounded-lg shadow-md p-6 mb-6">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-color-error text-color-error rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-color-success text-color-success rounded-md">
              {success}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-color-primary mb-2 break-words">{submission.subject}</h1>
              <p className="text-color-muted-text text-sm">
                Tracking Code: <span className="font-mono font-bold">{submission.trackingCode}</span>
              </p>
            </div>
            <div className="flex-shrink-0">
              <Badge status={submission.status} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-color-border">
            <div>
              <p className="text-sm text-color-muted-text mb-1">Category</p>
              <p className="font-medium text-color-body-text">{submission.category}</p>
            </div>
            <div>
              <p className="text-sm text-color-muted-text mb-1">Priority</p>
              <select
                value={submission.priority}
                onChange={(e) =>
                  handlePriorityChange(e.target.value as Submission['priority'])
                }
                disabled={updating}
                className="block w-full px-3 py-2 border border-color-border rounded-md text-sm focus:ring-2 focus:ring-color-accent disabled:opacity-50"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <p className="text-sm text-color-muted-text mb-1">Status</p>
              <select
                value={submission.status}
                onChange={(e) =>
                  handleStatusChange(e.target.value as Submission['status'])
                }
                disabled={updating}
                className="block w-full px-3 py-2 border border-color-border rounded-md text-sm focus:ring-2 focus:ring-color-accent disabled:opacity-50"
              >
                <option value="received">Received</option>
                <option value="in_review">In Review</option>
                <option value="in_progress">In Progress</option>
                <option value="escalated">Escalated</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <p className="text-sm text-color-muted-text mb-1">Assigned To</p>
              <select
                value={submission.assignedTo || ''}
                onChange={(e) => handleAssignmentChange(e.target.value || undefined)}
                disabled={updating}
                className="block w-full px-3 py-2 border border-color-border rounded-md text-sm focus:ring-2 focus:ring-color-accent disabled:opacity-50"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-color-primary mb-2">Description</h2>
            <p className="text-color-body-text whitespace-pre-wrap">{submission.description}</p>
          </div>

          {submission.attachments && submission.attachments.length > 0 && (
            <div className="mb-6 pb-6 border-b border-color-border">
              <AttachmentGallery
                attachments={submission.attachments}
                onDownload={(attachment) => downloadFile(submission.id, attachment)}
                onView={(attachment) => { viewFile(submission.id, attachment); }}
                loading={downloading}
              />
            </div>
          )}

          {submission.submitterEmail && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-color-primary mb-2">Submitter</h2>
              <p className="text-color-body-text">
                {submission.isAnonymous ? 'Anonymous' : submission.submitterEmail}
              </p>
            </div>
          )}

          {submission.satisfactionScore != null && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-color-primary mb-2">Satisfaction Rating</h2>
              <SatisfactionBadge score={submission.satisfactionScore} label={submission.satisfactionLabel ?? undefined} />
            </div>
          )}

          <div className="mb-6 pb-6 border-b border-color-border">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-color-primary">Assigned To</h2>
              {assignedMember && (
                <Badge variant="primary">{assignedMember.name}</Badge>
              )}
            </div>
            <p className="text-sm text-color-muted-text">
              Created: {formatDate(new Date(submission.createdAt.toMillis()))}
            </p>
            {submission.resolvedAt && (
              <p className="text-sm text-color-muted-text">
                Resolved: {formatDate(new Date(submission.resolvedAt.toMillis()))}
              </p>
            )}
          </div>

          <div className="mb-6 rounded-xl border border-[#d6cabf] bg-[#f5f0ec] p-4">
            <div className="mb-3 flex items-center gap-2 text-[#1c1917]">
              <History size={17} />
              <h2 className="text-base font-semibold">Escalation History</h2>
            </div>
            {escalationLog.length === 0 ? (
              <p className="text-sm text-[#78716c]">No automated escalations have triggered for this submission.</p>
            ) : (
              <ul className="space-y-2">
                {escalationLog.map((entry) => (
                  <li key={entry.id} className="rounded-lg bg-white px-3 py-2 text-sm text-[#3c3632] ring-1 ring-[#d6cabf]/70">
                    Rule <span className="font-semibold text-[#1c1917]">“{entry.ruleName}”</span> triggered {entry.triggeredAt ? formatDistanceToNow(entry.triggeredAt.toDate(), { addSuffix: true }) : 'recently'} → {entry.actionsTaken.join(', ')}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mb-6 pb-6 border-b border-color-border">
            <InternalDiscussion
              submission={submission}
              currentUser={user}
              onMigrated={loadData}
            />
          </div>

          <div className="mb-6 pb-6 border-b border-color-border">
            <h2 className="text-lg font-semibold text-color-primary mb-4">Public Reply</h2>
            <textarea
              value={publicReply}
              onChange={(e) => setPublicReply(e.target.value)}
              disabled={updating}
              placeholder="Add a public reply visible to the submitter..."
              className="w-full px-4 py-3 border border-color-border rounded-md focus:ring-2 focus:ring-color-accent focus:border-transparent disabled:opacity-50 resize-none"
              rows={4}
            />
            <Button
              onClick={handlePublicReplyChange}
              disabled={updating}
              isLoading={updating}
              className="mt-3"
            >
              Save Reply
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
