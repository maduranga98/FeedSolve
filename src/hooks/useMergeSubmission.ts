import { useCallback, useState } from "react";
import {
  Timestamp,
  arrayUnion,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { getSubmission } from "../lib/firestore";
import type { Submission, User } from "../types";
import type { InternalComment } from "../types/comment";

const SEARCH_LIMIT = 100;

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function matchesSubmissionSearch(submission: Submission, term: string) {
  if (!term) return false;
  return (
    submission.trackingCode.toLowerCase().includes(term) ||
    submission.subject.toLowerCase().includes(term)
  );
}

function makeMergeComment(masterId: string, source: Submission, user: User): InternalComment {
  return {
    id: doc(collection(db, "submissions", masterId, "internalComments")).id,
    body: `Submission ${source.trackingCode} was merged into this submission by ${user.name}.`,
    authorId: user.id,
    authorName: user.name,
    authorAvatar: null,
    authorType: "system",
    createdAt: Timestamp.now(),
    editedAt: null,
    isEdited: false,
    isDeleted: false,
    parentId: null,
  };
}

export function useMergeSubmission(user: User | null) {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchMasterSubmissions = useCallback(
    async (source: Submission, searchTerm: string, includeAllBoards: boolean) => {
      if (!user) return [];
      const normalized = normalizeSearch(searchTerm);
      if (!normalized) return [];

      setSearching(true);
      setError(null);
      try {
        const constraints = [
          where("companyId", "==", user.companyId),
          orderBy("createdAt", "desc"),
          limit(SEARCH_LIMIT),
        ];
        const snapshot = await getDocs(query(collection(db, "submissions"), ...constraints));
        return snapshot.docs
          .map((submissionDoc) => ({ ...submissionDoc.data(), id: submissionDoc.id }) as Submission)
          .filter((candidate) => {
            if (candidate.id === source.id) return false;
            if (candidate.isMerged) return false;
            if (!includeAllBoards && candidate.boardId !== source.boardId) return false;
            return matchesSubmissionSearch(candidate, normalized);
          });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to search submissions.";
        setError(message);
        return [];
      } finally {
        setSearching(false);
      }
    },
    [user]
  );

  const mergeSubmission = useCallback(
    async (source: Submission, master: Submission) => {
      if (!user) throw new Error("You must be signed in to merge submissions.");
      if (source.id === master.id) throw new Error("A submission cannot be merged into itself.");
      if (source.isMerged) throw new Error("This submission has already been merged.");
      if (master.isMerged) throw new Error("Choose a master submission that has not been merged.");
      if (source.companyId !== master.companyId || source.companyId !== user.companyId) {
        throw new Error("Submissions must belong to your company.");
      }

      setLoading(true);
      setError(null);
      try {
        const now = Timestamp.now();
        const batch = writeBatch(db);
        const sourceRef = doc(db, "submissions", source.id);
        const masterRef = doc(db, "submissions", master.id);
        const comment = makeMergeComment(master.id, source, user);
        const commentRef = doc(db, "submissions", master.id, "internalComments", comment.id);

        batch.update(sourceRef, {
          isMerged: true,
          mergedInto: master.id,
          mergedAt: now,
          mergedBy: user.id,
          status: "closed",
          resolvedAt: now,
          updatedAt: now,
        });
        batch.update(masterRef, {
          mergedSubmissions: arrayUnion(source.id),
          updatedAt: now,
        });
        batch.set(commentRef, { ...comment, createdAt: now });
        await batch.commit();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to merge submissions.";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const loadMergedSubmissions = useCallback(async (ids: string[]) => {
    const uniqueIds = Array.from(new Set(ids)).filter(Boolean);
    const submissions = await Promise.all(uniqueIds.map((id) => getSubmission(id)));
    return submissions.filter((submission): submission is Submission => Boolean(submission));
  }, []);

  return {
    loading,
    searching,
    error,
    searchMasterSubmissions,
    mergeSubmission,
    loadMergedSubmissions,
  };
}
