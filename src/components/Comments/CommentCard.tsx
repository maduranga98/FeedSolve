import { useState } from 'react';
import { Trash2, Edit2, SmilePlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import type { Comment as CommentType, Reaction } from '../../types';
import { ReactionPicker } from './ReactionPicker';

interface CommentCardProps {
  comment: CommentType & { id: string };
  currentUserId: string;
  onDelete: (commentId: string) => void;
  onEdit: (commentId: string, newContent: string) => void;
  onReply: (commentId: string) => void;
  onAddReaction: (commentId: string, emoji: string) => void;
  onRemoveReaction: (commentId: string, emoji: string) => void;
  replies?: (CommentType & { id: string })[];
  isReply?: boolean;
}

export const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  currentUserId,
  onDelete,
  onEdit,
  onReply,
  onAddReaction,
  onRemoveReaction,
  replies,
  isReply,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const handleSaveEdit = () => {
    if (editedContent.trim()) {
      onEdit(comment.id, editedContent);
      setIsEditing(false);
    }
  };

  const isAuthor = comment.author.id === currentUserId;
  const isDeleted = comment.content === '[deleted]';

  return (
    <div className={`${isReply ? 'ml-6 mb-4' : 'mb-4'}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition">
        {/* Comment Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {comment.author.avatar && (
              <img
                src={comment.author.avatar}
                alt={comment.author.name}
                className="w-8 h-8 rounded-full"
              />
            )}
            <div>
              <div className="font-medium text-gray-900">{comment.author.name}</div>
              <div className="text-xs text-gray-500">
                {formatDistanceToNow(new Date((comment.createdAt as Timestamp).toDate()), {
                  addSuffix: true,
                })}
                {comment.isEdited && <span className="ml-1">(edited)</span>}
              </div>
            </div>
          </div>

          {/* Actions */}
          {isAuthor && !isDeleted && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition"
                title="Edit"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => onDelete(comment.id)}
                className="p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded transition"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Comment Content */}
        {isEditing ? (
          <div className="mb-3">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(comment.content);
                }}
                className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-gray-700 whitespace-pre-wrap break-words mb-3">
            {comment.content}
          </div>
        )}

        {/* Reactions */}
        {comment.reactions && comment.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {comment.reactions.map((reaction: Reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => {
                  if (reaction.userIds.includes(currentUserId)) {
                    onRemoveReaction(comment.id, reaction.emoji);
                  } else {
                    onAddReaction(comment.id, reaction.emoji);
                  }
                }}
                className={`px-2 py-1 rounded-full text-sm transition ${
                  reaction.userIds.includes(currentUserId)
                    ? 'bg-blue-100 border border-blue-300'
                    : 'bg-gray-100 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                {reaction.emoji} {reaction.userIds.length}
              </button>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center gap-4 text-xs text-gray-600 border-t border-gray-100 pt-3 -mx-4 px-4 relative">
          <button
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className="flex items-center gap-1 hover:text-gray-900 transition"
          >
            <SmilePlus size={14} />
            React
          </button>
          {!isReply && (
            <button
              onClick={() => onReply(comment.id)}
              className="flex items-center gap-1 hover:text-gray-900 transition"
            >
              Reply
            </button>
          )}

          {showReactionPicker && (
            <ReactionPicker
              isOpen={showReactionPicker}
              onClose={() => setShowReactionPicker(false)}
              onSelectEmoji={(emoji) => onAddReaction(comment.id, emoji)}
            />
          )}
        </div>
      </div>

      {/* Replies */}
      {replies && replies.length > 0 && (
        <div className="mt-2">
          {replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onDelete={onDelete}
              onEdit={onEdit}
              onReply={onReply}
              onAddReaction={onAddReaction}
              onRemoveReaction={onRemoveReaction}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
};
