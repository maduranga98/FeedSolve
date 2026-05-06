import { useCallback, useMemo, useState } from "react";
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  startAfter,
  updateDoc,
  writeBatch,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { User } from "../types";
import type { InternalComment, InternalCommentInput } from "../types/comment";

const PAGE_SIZE = 10;

function commentsCollection(submissionId: string) {
  return collection(db, "submissions", submissionId, "internalComments");
}

function makeComment(
  submissionId: string,
  input: InternalCommentInput,
  user: User,
  id = doc(commentsCollection(submissionId)).id
): InternalComment {
  return {
    id,
    body: input.body.trim(),
    authorId: user.id,
    authorName: user.name,
    authorAvatar: null,
    createdAt: Timestamp.now(),
    editedAt: null,
    isEdited: false,
    isDeleted: false,
    parentId: input.parentId ?? null,
  };
}

function sortNewestFirst(comments: InternalComment[]) {
  return [...comments].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
}

export function useInternalComments(submissionId: string, user: User | null) {
  const [comments, setComments] = useState<InternalComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const loadComments = useCallback(async (append = false): Promise<InternalComment[]> => {
    if (!submissionId) return [];
    setLoading(true);
    setError(null);

    try {
      const constraints = [orderBy("createdAt", "desc"), limit(PAGE_SIZE + 1)];
      const commentsQuery = append && lastDoc
        ? query(commentsCollection(submissionId), orderBy("createdAt", "desc"), startAfter(lastDoc), limit(PAGE_SIZE + 1))
        : query(commentsCollection(submissionId), ...constraints);

      const snapshot = await getDocs(commentsQuery);
      const docs = snapshot.docs.slice(0, PAGE_SIZE);
      const fetched = docs.map(commentDoc => commentDoc.data() as InternalComment);

      setComments(current => {
        const merged = append ? [...current, ...fetched] : fetched;
        const deduped = new Map(merged.map(comment => [comment.id, comment]));
        return sortNewestFirst(Array.from(deduped.values()));
      });
      setLastDoc(docs.length > 0 ? docs[docs.length - 1] : null);
      setHasMore(snapshot.docs.length > PAGE_SIZE);
      return fetched;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load internal comments.");
      return [];
    } finally {
      setLoading(false);
    }
  }, [lastDoc, submissionId]);

  const addComment = useCallback(async (input: InternalCommentInput) => {
    if (!user) throw new Error("You must be signed in to comment.");

    const newComment = makeComment(submissionId, input, user);
    setComments(current => sortNewestFirst([newComment, ...current]));
    setSaving(true);
    setError(null);

    try {
      await setDoc(doc(commentsCollection(submissionId), newComment.id), newComment);
      return newComment;
    } catch (err) {
      setComments(current => current.filter(comment => comment.id !== newComment.id));
      setError(err instanceof Error ? err.message : "Failed to post comment.");
      throw err;
    } finally {
      setSaving(false);
    }
  }, [submissionId, user]);

  const editComment = useCallback(async (commentId: string, body: string) => {
    const editedAt = Timestamp.now();
    const previous = comments;
    setComments(current => current.map(comment => (
      comment.id === commentId
        ? { ...comment, body: body.trim(), editedAt, isEdited: true }
        : comment
    )));
    setSaving(true);
    setError(null);

    try {
      await updateDoc(doc(commentsCollection(submissionId), commentId), {
        body: body.trim(),
        editedAt,
        isEdited: true,
      });
    } catch (err) {
      setComments(previous);
      setError(err instanceof Error ? err.message : "Failed to edit comment.");
      throw err;
    } finally {
      setSaving(false);
    }
  }, [comments, submissionId]);

  const deleteComment = useCallback(async (commentId: string) => {
    const previous = comments;
    const hasReplies = comments.some(comment => comment.parentId === commentId);

    if (hasReplies) {
      setComments(current => current.map(comment => (
        comment.id === commentId
          ? { ...comment, body: null, isDeleted: true, editedAt: Timestamp.now() }
          : comment
      )));
    } else {
      setComments(current => current.filter(comment => comment.id !== commentId));
    }

    setSaving(true);
    setError(null);

    try {
      if (hasReplies) {
        await updateDoc(doc(commentsCollection(submissionId), commentId), {
          body: null,
          isDeleted: true,
          editedAt: Timestamp.now(),
        });
      } else {
        await deleteDoc(doc(commentsCollection(submissionId), commentId));
      }
    } catch (err) {
      setComments(previous);
      setError(err instanceof Error ? err.message : "Failed to delete comment.");
      throw err;
    } finally {
      setSaving(false);
    }
  }, [comments, submissionId]);

  const setMigratedComments = useCallback((migratedComments: InternalComment[]) => {
    setComments(current => sortNewestFirst([...migratedComments, ...current]));
  }, []);

  const topLevelComments = useMemo(
    () => comments.filter(comment => !comment.parentId),
    [comments]
  );

  const repliesByParentId = useMemo(() => {
    const grouped = new Map<string, InternalComment[]>();
    comments.forEach(comment => {
      if (!comment.parentId) return;
      const replies = grouped.get(comment.parentId) ?? [];
      replies.push(comment);
      grouped.set(comment.parentId, replies.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis()));
    });
    return grouped;
  }, [comments]);

  return {
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
  };
}

export async function createMigratedInternalComments(
  submissionId: string,
  comments: InternalComment[]
) {
  const batch = writeBatch(db);
  comments.forEach(comment => {
    batch.set(doc(commentsCollection(submissionId), comment.id), comment);
  });
  await batch.commit();
}
