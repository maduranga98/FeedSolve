import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Lock, RefreshCw } from "lucide-react";
import type { Submission, User } from "../../types";
import { useInternalComments } from "../../hooks/useInternalComments";
import { migrateInternalNotesOnFirstLoad } from "../../utils/migrateInternalNotes";
import { CommentInput } from "./CommentInput";
import { CommentItem } from "./CommentItem";

interface InternalDiscussionProps {
  submission: Submission;
  currentUser: User | null;
  onMigrated?: () => void;
}

export function InternalDiscussion({ submission, currentUser, onMigrated }: InternalDiscussionProps) {
  const { t } = useTranslation();
  const {
    comments,
    topLevelComments,
    repliesByParentId,
    loading,
    saving,
    error,
    hasMore,
    loadComments,
    addComment,
    editComment,
    deleteComment,
    setMigratedComments,
  } = useInternalComments(submission.id, currentUser);

  const loadInitialComments = useCallback(async () => {
    const loadedComments = await loadComments(false);
    if (!currentUser) return;

    const migratedComments = await migrateInternalNotesOnFirstLoad(
      submission,
      currentUser,
      loadedComments.length
    );

    if (migratedComments.length > 0) {
      setMigratedComments(migratedComments);
      onMigrated?.();
    }
  }, [currentUser, loadComments, onMigrated, setMigratedComments, submission]);

  useEffect(() => {
    void loadInitialComments();
  }, [loadInitialComments]);

  const handleRefresh = () => {
    void loadComments(false);
  };

  const handleLoadEarlier = () => {
    void loadComments(true);
  };

  return (
    <section className="rounded-xl border border-[#d6cabf] bg-[#f1ebe5] p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#1c1917] text-white">
            <Lock size={17} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-[#1c1917]">{t('internal_discussion.title')}</h3>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-[#1c1917] ring-1 ring-[#d6cabf]">
                {comments.length}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-[#78716c]">{t('internal_discussion.team_only')}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="rounded-lg border border-[#d6cabf] bg-white p-2 text-[#78716c] transition hover:text-[#c0694a] disabled:opacity-50"
          title={t('internal_discussion.refresh')}
          aria-label={t('internal_discussion.refresh')}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[#FADBD8] bg-[#FDECEA] p-3 text-sm text-[#C0392B]">
          {error}
        </div>
      )}

      <div className="mb-4 space-y-3">
        {hasMore && (
          <button
            type="button"
            onClick={handleLoadEarlier}
            disabled={loading}
            className="w-full rounded-lg border border-[#d6cabf] bg-white px-3 py-2 text-sm font-semibold text-[#c0694a] transition hover:bg-[#f5f0ec] disabled:opacity-50"
          >
            {t('internal_discussion.load_earlier')}
          </button>
        )}

        {loading && comments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#d6cabf] bg-white/70 py-8 text-center text-sm text-[#78716c]">
            {t('internal_discussion.loading')}
          </div>
        ) : topLevelComments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#d6cabf] bg-white/70 py-8 text-center text-sm text-[#78716c]">
            {t('internal_discussion.empty')}
          </div>
        ) : (
          [...topLevelComments]
            .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis())
            .map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                replies={repliesByParentId.get(comment.id) ?? []}
                currentUserId={currentUser?.id ?? ""}
                onReply={async (parentId, body) => {
                  await addComment({ parentId, body });
                }}
                onEdit={editComment}
                onDelete={deleteComment}
              />
            ))
        )}
      </div>

      <CommentInput
        onSubmit={async body => {
          await addComment({ body });
        }}
        loading={saving}
      />
    </section>
  );
}
