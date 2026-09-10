import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, MoreHorizontal } from "lucide-react";
import type { InternalComment } from "../../types/comment";
import { Avatar } from "./Avatar";
import { CommentInput } from "./CommentInput";

interface CommentItemProps {
  comment: InternalComment;
  replies?: InternalComment[];
  currentUserId: string;
  onReply: (parentId: string, body: string) => Promise<void>;
  onEdit: (commentId: string, body: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  isReply?: boolean;
}

function relativeTime(comment: InternalComment) {
  return formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true });
}

export function CommentItem({
  comment,
  replies = [],
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  isReply = false,
}: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isSystemComment = comment.authorType === "system" || comment.authorId === "feedsolve_bot";
  const isOwnComment = comment.authorId === currentUserId && !isSystemComment;

  return (
    <div className={isReply ? "pl-8 border-l-2 border-[var(--c-bd6cabf)]" : ""}>
      <div className={`group rounded-xl p-3 shadow-sm ring-1 ${isSystemComment ? "bg-[var(--c-sf1efe8)] ring-[var(--c-bd6cabf)]" : "bg-[var(--c-sffffff)] ring-[var(--c-bd6cabf)]/70"}`}>
        <div className="flex gap-3">
          {isSystemComment ? (
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--c-sffffff)] ring-1 ring-[var(--c-bd6cabf)]">
              <img src="/logo.png" alt="FeedSolve" className="h-5 w-5 object-contain" />
            </div>
          ) : (
            <Avatar userId={comment.authorId} name={comment.authorName} />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="truncate text-sm font-semibold text-[var(--c-t1c1917)]">{isSystemComment ? "FeedSolve" : comment.authorName}</p>
                  {isSystemComment && <span className="rounded-full bg-[var(--c-sffffff)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--c-t78716c)]">system</span>}
                  <span className="text-xs text-[var(--c-t78716c)]">{relativeTime(comment)}</span>
                  {comment.isEdited && !comment.isDeleted && (
                    <span className="text-xs font-medium text-[var(--c-t78716c)]">Edited</span>
                  )}
                </div>
              </div>

              {isOwnComment && !comment.isDeleted && !isEditing && (
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                  <MoreHorizontal size={14} className="hidden text-[var(--c-t78716c)] sm:block" />
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-medium text-[var(--c-tc0694a)] hover:text-[var(--c-t1c1917)]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="text-xs font-medium text-[var(--c-tc0392b)] hover:text-[var(--c-t922b21)]"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="mt-2">
                <CommentInput
                  initialValue={comment.body ?? ""}
                  submitLabel="Save"
                  autoFocus
                  compact
                  onSubmit={async body => {
                    await onEdit(comment.id, body);
                    setIsEditing(false);
                  }}
                  onCancel={() => setIsEditing(false)}
                />
              </div>
            ) : (
              <p className={`mt-2 whitespace-pre-wrap text-sm leading-relaxed ${comment.isDeleted ? "italic text-[var(--c-t78716c)]" : "text-[var(--c-t3c3632)]"}`}>
                {comment.isDeleted ? "This comment was deleted" : comment.body}
              </p>
            )}

            {confirmDelete && (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-[var(--c-bf1c0b8)] bg-[var(--c-sfdecea)] px-3 py-2 text-sm text-[var(--c-t922b21)]">
                <span className="mr-auto">Delete this comment?</span>
                <button
                  type="button"
                  onClick={async () => {
                    await onDelete(comment.id);
                    setConfirmDelete(false);
                  }}
                  className="rounded-md bg-[var(--c-sc0392b)] px-2.5 py-1 text-xs font-semibold text-white"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-md bg-[var(--c-sffffff)] px-2.5 py-1 text-xs font-semibold text-[var(--c-t78716c)]"
                >
                  Cancel
                </button>
              </div>
            )}

            {!isSystemComment && !isReply && !comment.isDeleted && !isEditing && (
              <button
                type="button"
                onClick={() => setIsReplying(true)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--c-tc0694a)] hover:text-[var(--c-t1c1917)]"
              >
                <MessageCircle size={13} /> Reply
              </button>
            )}
          </div>
        </div>
      </div>

      {!isReply && isReplying && (
        <div className="mt-3 pl-8 border-l-2 border-[var(--c-bd6cabf)]">
          <CommentInput
            compact
            autoFocus
            placeholder="Write a reply..."
            onSubmit={async body => {
              await onReply(comment.id, body);
              setIsReplying(false);
            }}
            onCancel={() => setIsReplying(false)}
          />
        </div>
      )}

      {replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}
