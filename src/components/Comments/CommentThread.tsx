import { useEffect, useState, useCallback } from 'react';
import { onSnapshot, collection, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  addComment,
  getComments,
  updateComment,
  deleteComment,
  addReaction,
  removeReaction,
  createCommentNotification,
} from '../../lib/firestore';
import type { Comment as CommentType, TeamMember, User } from '../../types';
import { CommentInput } from './CommentInput';
import { CommentCard } from './CommentCard';

interface CommentThreadProps {
  submissionId: string;
  companyId: string;
  currentUser: User;
  teamMembers: TeamMember[];
  onCommentAdded?: (commentCount: number) => void;
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  submissionId,
  companyId,
  currentUser,
  teamMembers,
  onCommentAdded,
}) => {
  const [comments, setComments] = useState<(CommentType & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Set up real-time listener
  useEffect(() => {
    const commentsRef = collection(db, 'submissions', submissionId, 'comments');
    const unsub = onSnapshot(
      commentsRef,
      (snapshot) => {
        const updatedComments = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as CommentType & { id: string }))
          .sort((a, b) => {
            const aTime = (a.createdAt as Timestamp).toDate().getTime();
            const bTime = (b.createdAt as Timestamp).toDate().getTime();
            return aTime - bTime;
          });

        setComments(updatedComments);
        onCommentAdded?.(updatedComments.length);
      },
      (error) => {
        console.error('Error listening to comments:', error);
      }
    );

    setUnsubscribe(() => unsub);
    return () => unsub();
  }, [submissionId, onCommentAdded]);

  const handleAddComment = useCallback(
    async (content: string, mentions: string[]) => {
      setIsLoading(true);
      try {
        const commentId = await addComment(
          submissionId,
          companyId,
          content,
          {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
          },
          mentions,
          replyingTo || undefined
        );

        // Create notifications for mentioned users
        for (const userId of mentions) {
          await createCommentNotification(
            companyId,
            userId,
            currentUser.id,
            submissionId,
            commentId
          );
        }

        setReplyingTo(null);
      } catch (error) {
        console.error('Error adding comment:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [submissionId, companyId, currentUser, replyingTo]
  );

  const handleEditComment = useCallback(
    async (commentId: string, newContent: string) => {
      try {
        await updateComment(submissionId, commentId, newContent);
      } catch (error) {
        console.error('Error editing comment:', error);
      }
    },
    [submissionId]
  );

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      try {
        await deleteComment(submissionId, commentId);
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    },
    [submissionId]
  );

  const handleAddReaction = useCallback(
    async (commentId: string, emoji: string) => {
      try {
        await addReaction(submissionId, commentId, emoji, currentUser.id);
      } catch (error) {
        console.error('Error adding reaction:', error);
      }
    },
    [submissionId, currentUser.id]
  );

  const handleRemoveReaction = useCallback(
    async (commentId: string, emoji: string) => {
      try {
        await removeReaction(submissionId, commentId, emoji, currentUser.id);
      } catch (error) {
        console.error('Error removing reaction:', error);
      }
    },
    [submissionId, currentUser.id]
  );

  // Group comments by parent
  const topLevelComments = comments.filter(c => !c.parentCommentId);
  const getRepliesToComment = (parentId: string) =>
    comments.filter(c => c.parentCommentId === parentId);

  return (
    <div className="space-y-6">
      {/* Comment Count */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Start the conversation!
          </div>
        ) : (
          topLevelComments.map(comment => (
            <CommentCard
              key={comment.id}
              comment={comment}
              currentUserId={currentUser.id}
              onDelete={handleDeleteComment}
              onEdit={handleEditComment}
              onReply={(commentId) => setReplyingTo(commentId)}
              onAddReaction={handleAddReaction}
              onRemoveReaction={handleRemoveReaction}
              replies={getRepliesToComment(comment.id)}
            />
          ))
        )}
      </div>

      {/* Reply Section */}
      {replyingTo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 ml-6">
          <div className="text-sm font-medium text-blue-900 mb-3">
            Replying to comment...
          </div>
          <CommentInput
            onSubmit={handleAddComment}
            teamMembers={teamMembers}
            isLoading={isLoading}
            onCancel={() => setReplyingTo(null)}
            showCancel
            isReply
            placeholder="Write a reply..."
          />
        </div>
      )}

      {/* Main Comment Input */}
      {!replyingTo && (
        <CommentInput
          onSubmit={handleAddComment}
          teamMembers={teamMembers}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
