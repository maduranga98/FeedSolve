import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useHasFeature } from '../../hooks/useHasFeature';
import { addAuditLog, addPublicReply, getBoard } from '../../lib/firestore';
import { formatDate } from '../../lib/utils';
import ReplyForm from './ReplyForm';
import type { Submission } from '../../types';

interface PublicReplySectionProps {
  submissionId: string;
  publicReply?: string;
  publicReplyAt?: any;
  publicReplyBy?: string;
  onReplyAdded?: () => void;
  submission?: Submission;
}

export default function PublicReplySection({
  submissionId,
  publicReply,
  publicReplyAt,
  publicReplyBy,
  onReplyAdded,
  submission,
}: PublicReplySectionProps) {
  const { user } = useAuth();
  const { checkFeature } = useHasFeature();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [boardName, setBoardName] = useState('');

  const canReply = checkFeature('canReply');

  // Load board name for template variable resolution
  useEffect(() => {
    if (!submission?.boardId) return;
    getBoard(submission.boardId)
      .then((board) => { if (board) setBoardName(board.name); })
      .catch(() => {});
  }, [submission?.boardId]);

  if (!canReply) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border border-dashed border-[#d6cabf] bg-[#f5f0ec] text-sm text-[#78716c]">
        <Lock size={15} className="shrink-0 text-[#8f8680]" />
        <span>
          Public replies are available on the <strong>Starter</strong> plan and above.{' '}
          <button
            onClick={() => navigate('/pricing')}
            className="text-[#c0694a] hover:underline font-medium"
          >
            Upgrade
          </button>
        </span>
      </div>
    );
  }

  const handleSubmitReply = async (text: string) => {
    if (!user) return;
    setLoading(true);
    try {
      await addPublicReply(submissionId, text, user.name);
      void addAuditLog(user.companyId, {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: publicReply ? 'Updated public reply' : 'Added public reply',
        resourceType: 'submission',
        resourceId: submissionId,
        resourceName: submission?.subject,
        details: { replyLength: text.trim().length, hadPreviousReply: Boolean(publicReply) },
      });
      setIsEditing(false);
      onReplyAdded?.();
    } catch (error) {
      console.error('Failed to add reply:', error);
      alert('Failed to add reply');
    } finally {
      setLoading(false);
    }
  };

  if (!publicReply && !isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="w-full py-4 px-4 border border-dashed border-[#d6cabf] rounded-lg text-[#78716c] hover:bg-[#f5f0ec] transition-colors text-sm"
      >
        + Add public reply
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#1c1917]">Public Reply</h3>
        {publicReply && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-[#c0694a] hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <ReplyForm
          onSubmit={handleSubmitReply}
          loading={loading}
          initialValue={publicReply}
          onCancel={() => setIsEditing(false)}
          submission={submission}
          boardName={boardName}
        />
      ) : (
        <div className="bg-[#f5f0ec] border border-[#d6cabf] rounded-lg p-4">
          <p className="text-[#3c3632] whitespace-pre-wrap mb-2">{publicReply}</p>
          {publicReplyAt && publicReplyBy && (
            <p className="text-xs text-[#78716c]">
              {publicReplyBy} • {formatDate(publicReplyAt.toDate())}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
