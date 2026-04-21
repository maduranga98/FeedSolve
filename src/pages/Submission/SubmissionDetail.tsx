import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button, Badge, LoadingSpinner } from '../../components/Shared';
import {
  getSubmission,
  updateSubmissionStatus,
  updateSubmissionPriority,
  updateSubmissionAssignment,
  addInternalNote,
  updateSubmissionPublicReply,
  getTeamMembers,
} from '../../lib/firestore';
import { formatDate } from '../../lib/utils';
import type { Submission, TeamMember, User } from '../../types';

export function SubmissionDetail() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [publicReply, setPublicReply] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user || !submissionId) return null;

  const currentUser = user as User;

  useEffect(() => {
    loadData();
  }, [submissionId]);

  async function loadData() {
    if (!submissionId) return;
    try {
      setLoading(true);
      const [submissionData, members] = await Promise.all([
        getSubmission(submissionId),
        getTeamMembers(currentUser.companyId),
      ]);

      if (!submissionData) {
        setError('Submission not found');
        return;
      }

      setSubmission(submissionData);
      setTeamMembers(members);
      setPublicReply(submissionData.publicReply || '');
    } catch (err) {
      setError('Failed to load submission');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: Submission['status']) {
    if (!submission) return;
    try {
      setUpdating(true);
      await updateSubmissionStatus(submission.id, newStatus);
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
    if (!submission) return;
    try {
      setUpdating(true);
      await updateSubmissionPriority(submission.id, newPriority);
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
    if (!submission) return;
    try {
      setUpdating(true);
      await updateSubmissionAssignment(submission.id, userId);
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

  async function handleAddNote() {
    if (!submission || !newNote.trim()) return;
    try {
      setUpdating(true);
      await addInternalNote(submission.id, newNote, currentUser.id);
      setSuccess('Note added');
      setNewNote('');
      await loadData();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Failed to add note');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  }

  async function handlePublicReplyChange() {
    if (!submission) return;
    try {
      setUpdating(true);
      await updateSubmissionPublicReply(submission.id, publicReply);
      setSuccess('Public reply updated');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Failed to update public reply');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  }

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
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-color-accent hover:text-color-primary mb-6 font-medium"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
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

          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-color-primary mb-2">{submission.subject}</h1>
              <p className="text-color-muted-text">
                Tracking Code: <span className="font-mono font-bold">{submission.trackingCode}</span>
              </p>
            </div>
            <Badge status={submission.status} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-color-border">
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

          {submission.submitterEmail && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-color-primary mb-2">Submitter</h2>
              <p className="text-color-body-text">
                {submission.isAnonymous ? 'Anonymous' : submission.submitterEmail}
              </p>
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

          <div>
            <h2 className="text-lg font-semibold text-color-primary mb-4">Internal Notes</h2>
            <div className="mb-4 space-y-3">
              {submission.internalNotes.length === 0 ? (
                <p className="text-color-muted-text text-sm">No internal notes yet.</p>
              ) : (
                submission.internalNotes.map((note) => (
                  <div key={note.id} className="p-3 bg-blue-50 rounded-md border border-color-accent-light">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-sm text-color-primary">Internal Note</p>
                      <p className="text-xs text-color-muted-text">
                        {formatDate(new Date(note.createdAt.toMillis()))}
                      </p>
                    </div>
                    <p className="text-sm text-color-body-text whitespace-pre-wrap">{note.text}</p>
                  </div>
                ))
              )}
            </div>

            <div>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                disabled={updating}
                placeholder="Add an internal note..."
                className="w-full px-4 py-3 border border-color-border rounded-md focus:ring-2 focus:ring-color-accent focus:border-transparent disabled:opacity-50 resize-none"
                rows={3}
              />
              <Button
                onClick={handleAddNote}
                disabled={updating || !newNote.trim()}
                isLoading={updating}
                className="mt-3"
              >
                Add Note
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
