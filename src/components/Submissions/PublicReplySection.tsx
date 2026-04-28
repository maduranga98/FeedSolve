import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useHasFeature } from '../../hooks/useHasFeature';
import { addPublicReply } from '../../lib/firestore';
import { formatDate } from '../../lib/utils';
import ReplyForm from './ReplyForm';

interface PublicReplySectionProps {
  submissionId: string;
  publicReply?: string;
  publicReplyAt?: any;
  publicReplyBy?: string;
  onReplyAdded?: () => void;
}

export default function PublicReplySection({
  submissionId,
  publicReply,
  publicReplyAt,
  publicReplyBy,
  onReplyAdded,
}: PublicReplySectionProps) {
  const { user } = useAuth();
  const { checkFeature } = useHasFeature();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const canReply = checkFeature('canReply');

  if (!canReply) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border border-dashed border-[#D3D1C7] bg-[#F8FAFB] text-sm text-[#6B7B8D]">
        <Lock size={15} className="shrink-0 text-[#9AABBF]" />
        <span>
          Public replies are available on the <strong>Starter</strong> plan and above.{' '}
          <button
            onClick={() => navigate('/pricing')}
            className="text-[#2E86AB] hover:underline font-medium"
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
        className="w-full py-4 px-4 border border-dashed border-[#D3D1C7] rounded-lg text-[#6B7B8D] hover:bg-[#F8FAFB] transition-colors text-sm"
      >
        + Add public reply
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#1E3A5F]">Public Reply</h3>
        {publicReply && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-[#2E86AB] hover:underline"
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
        />
      ) : (
        <div className="bg-[#F8FAFB] border border-[#D3D1C7] rounded-lg p-4">
          <p className="text-[#444441] whitespace-pre-wrap mb-2">
            {publicReply}
          </p>
          {publicReplyAt && publicReplyBy && (
            <p className="text-xs text-[#6B7B8D]">
              {publicReplyBy} • {formatDate(publicReplyAt.toDate())}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
