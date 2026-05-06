import { useCallback, useState } from "react";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { getBoard, getCompany } from "../lib/firestore";
import type { Submission } from "../types";
import type { PublicSubmissionSummary } from "../components/Public/SubmissionListItem";

interface UseSubmissionsByEmailResult {
  submissions: PublicSubmissionSummary[];
  loading: boolean;
  error: string | null;
  lookupSubmissions: (email: string) => Promise<PublicSubmissionSummary[]>;
  reset: () => void;
}

const UNKNOWN_COMPANY = "Unknown company";
const UNKNOWN_BOARD = "Feedback board";

export function useSubmissionsByEmail(): UseSubmissionsByEmailResult {
  const [submissions, setSubmissions] = useState<PublicSubmissionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupSubmissions = useCallback(async (email: string) => {
    const normalizedEmail = email.trim();
    setLoading(true);
    setError(null);

    try {
      const submissionsRef = collection(db, "submissions");
      const emailQuery = query(
        submissionsRef,
        where("submitterEmail", "==", normalizedEmail),
        where("isAnonymous", "==", false),
        orderBy("createdAt", "desc"),
        limit(50)
      );

      const snapshot = await getDocs(emailQuery);
      const rawSubmissions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Submission));

      const companyIds = Array.from(new Set(rawSubmissions.map(submission => submission.companyId)));
      const boardIds = Array.from(new Set(rawSubmissions.map(submission => submission.boardId)));

      const [companyEntries, boardEntries] = await Promise.all([
        Promise.all(
          companyIds.map(async companyId => {
            try {
              const company = await getCompany(companyId);
              return [
                companyId,
                company?.branding?.companyName || company?.name || UNKNOWN_COMPANY,
              ] as const;
            } catch {
              return [companyId, UNKNOWN_COMPANY] as const;
            }
          })
        ),
        Promise.all(
          boardIds.map(async boardId => {
            try {
              const board = await getBoard(boardId);
              return [boardId, board?.name || UNKNOWN_BOARD] as const;
            } catch {
              return [boardId, UNKNOWN_BOARD] as const;
            }
          })
        ),
      ]);

      const companyNames = new Map(companyEntries);
      const boardNames = new Map(boardEntries);
      const results = rawSubmissions.map(submission => ({
        submission,
        boardName: boardNames.get(submission.boardId) || UNKNOWN_BOARD,
        companyId: submission.companyId,
        companyName: companyNames.get(submission.companyId) || UNKNOWN_COMPANY,
      }));

      setSubmissions(results);
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to look up submissions right now.";
      setError(message);
      setSubmissions([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSubmissions([]);
    setError(null);
  }, []);

  return { submissions, loading, error, lookupSubmissions, reset };
}
