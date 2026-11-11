import { useEffect, useMemo, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import type { Board, Submission } from '../../types';
import { getBoard, getUser } from '../../lib/firestore';
import { getSubmissionFieldDisplays, getSubmissionConfig } from '../../lib/submission-fields';

interface SubmissionCustomFieldsProps {
  submission: Submission;
  /** Pass when the board is already loaded; otherwise it is fetched by `submission.boardId`. */
  board?: Board | null;
}

/**
 * Detail-view section for custom-field submissions: walks the board's field definitions,
 * matches each stored answer by fieldId and renders label + value. Renders nothing for
 * fixed-form submissions (no `customFields`), which keep the standard Description block.
 */
export function SubmissionCustomFields({ submission, board: providedBoard }: SubmissionCustomFieldsProps) {
  const isCustom = submission.customFields !== undefined;
  const [fetchedBoard, setFetchedBoard] = useState<Board | null>(null);
  const [assignee, setAssignee] = useState<{ uid: string; name: string } | null>(null);

  const board = providedBoard ?? fetchedBoard;

  useEffect(() => {
    if (!isCustom || providedBoard) return;
    let cancelled = false;
    getBoard(submission.boardId)
      .then((data) => {
        if (!cancelled) setFetchedBoard(data);
      })
      .catch((error) => console.error('Failed to load board for custom fields:', error));
    return () => {
      cancelled = true;
    };
  }, [isCustom, providedBoard, submission.boardId]);

  const needsAssignee = useMemo(
    () => getSubmissionConfig(board).fields.some((field) => field.autoSource === 'assignedTo'),
    [board]
  );

  useEffect(() => {
    const uid = submission.assignedTo;
    if (!isCustom || !needsAssignee || !uid) return;
    let cancelled = false;
    getUser(uid)
      .then((data) => {
        if (!cancelled && data) setAssignee({ uid, name: data.name });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isCustom, needsAssignee, submission.assignedTo]);

  const displays = useMemo(
    () =>
      getSubmissionFieldDisplays(board, submission, {
        assigneeName: assignee && assignee.uid === submission.assignedTo ? assignee.name : null,
      }),
    [board, submission, assignee]
  );

  if (!isCustom || displays.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--c-be9e0d9)] bg-[var(--c-sfafafa)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <ClipboardList size={16} className="text-[var(--c-tc0694a)]" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--c-t8f8680)]">Submission details</h3>
      </div>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
        {displays.map((item) => (
          <div key={item.id} className={item.type === 'textarea' ? 'sm:col-span-2' : undefined}>
            <dt className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-[var(--c-t8f8680)]">
              {item.label}
              {item.autoSource && <span className="ml-1 font-normal normal-case text-[var(--c-t9aabbf)]">(auto)</span>}
              {item.removed && <span className="ml-1 font-normal normal-case text-[var(--c-t9aabbf)]">(no longer in form)</span>}
            </dt>
            <dd className="whitespace-pre-wrap break-words text-[var(--c-t3c3632)]">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
