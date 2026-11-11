import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Board, Submission, User } from '../../types';
import { Badge } from '../Shared';
import { getSubmissionFieldDisplays } from '../../lib/submission-fields';
import { SUBMISSION_STATUS_ORDER } from '../../lib/utils';

const PAGE_SIZE = 50;

type SortKey = 'createdAt' | 'status' | 'priority' | 'category' | 'assignee';
type SortDir = 'asc' | 'desc';

const PRIORITY_RANK: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
const PRIORITY_LABEL: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
const priorityDot: Record<string, string> = {
  low: 'bg-[var(--c-s3498db)]',
  medium: 'bg-[var(--c-sf39c12)]',
  high: 'bg-[var(--c-se74c3c)]',
  critical: 'bg-[var(--c-s8b0000)]',
};

const dateFormat = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

interface SubmissionTableProps {
  submissions: Submission[];
  boards?: Board[];
  usersMap?: Record<string, User>;
  onSubmissionClick: (submission: Submission) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectAll?: (ids: string[]) => void;
}

/**
 * Dense, sortable list for working through many submissions: one line per submission,
 * 50 per page. Custom fields flagged "show in list" appear under the subject.
 */
export function SubmissionTable({
  submissions,
  boards,
  usersMap,
  onSubmissionClick,
  selectedIds,
  onToggleSelect,
  onSelectAll,
}: SubmissionTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  const boardsById = useMemo(() => new Map((boards ?? []).map((board) => [board.id, board])), [boards]);

  const sorted = useMemo(() => {
    const assigneeName = (s: Submission) => (s.assignedTo ? usersMap?.[s.assignedTo]?.name ?? '' : '');
    const compare = (a: Submission, b: Submission): number => {
      switch (sortKey) {
        case 'createdAt':
          return a.createdAt.toMillis() - b.createdAt.toMillis();
        case 'status':
          return SUBMISSION_STATUS_ORDER.indexOf(a.status) - SUBMISSION_STATUS_ORDER.indexOf(b.status);
        case 'priority':
          return (PRIORITY_RANK[a.priority] ?? 0) - (PRIORITY_RANK[b.priority] ?? 0);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'assignee':
          return assigneeName(a).localeCompare(assigneeName(b));
      }
    };
    const direction = sortDir === 'asc' ? 1 : -1;
    return [...submissions].sort((a, b) => compare(a, b) * direction);
  }, [submissions, sortKey, sortDir, usersMap]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const allIds = useMemo(() => submissions.map((s) => s.id), [submissions]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds?.has(id));

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'createdAt' || key === 'priority' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  const sortHeader = (label: string, column: SortKey, className = '') => {
    const active = sortKey === column;
    return (
      <th
        key={column}
        scope="col"
        aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
        className={`px-3 py-2.5 text-left ${className}`}
      >
        <button
          type="button"
          onClick={() => toggleSort(column)}
          className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide hover:text-[var(--c-t1e3a5f)] ${
            active ? 'text-[var(--c-t1e3a5f)]' : 'text-[var(--c-t8f8680)]'
          }`}
        >
          {label}
          {active && (sortDir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
        </button>
      </th>
    );
  };

  if (submissions.length === 0) {
    return <p className="py-12 text-center text-sm text-[var(--c-t8f8680)]">No submissions match this view.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-[var(--c-be9e0d9)]">
        <table className="w-full min-w-[46rem] border-collapse text-sm">
          <thead className="bg-[var(--c-sfaf8f5)]">
            <tr className="border-b border-[var(--c-be9e0d9)]">
              {onToggleSelect && (
                <th scope="col" className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onSelectAll?.(e.target.checked ? allIds : [])}
                    aria-label="Select all submissions"
                    className="h-4 w-4 cursor-pointer accent-[var(--c-s2e86ab)]"
                  />
                </th>
              )}
              <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-[var(--c-t8f8680)]">
                Submission
              </th>
              {sortHeader('Category', 'category', 'hidden md:table-cell')}
              {sortHeader('Status', 'status')}
              {sortHeader('Priority', 'priority')}
              {sortHeader('Assignee', 'assignee', 'hidden lg:table-cell')}
              {sortHeader('Created', 'createdAt')}
            </tr>
          </thead>
          <tbody>
            {rows.map((submission) => {
              const assignee = submission.assignedTo ? usersMap?.[submission.assignedTo] : undefined;
              const board = boardsById.get(submission.boardId);
              const listFields =
                board && submission.customFields
                  ? getSubmissionFieldDisplays(board, submission, { listOnly: true, assigneeName: assignee?.name })
                  : [];
              const selected = selectedIds?.has(submission.id) ?? false;

              return (
                <tr
                  key={submission.id}
                  onClick={() => onSubmissionClick(submission)}
                  className={`cursor-pointer border-b border-[var(--c-bf0f4f8)] last:border-b-0 hover:bg-[var(--c-sf8fbfd)] ${
                    selected ? 'bg-[var(--c-sf8fbfd)]' : 'bg-[var(--c-sffffff)]'
                  }`}
                >
                  {onToggleSelect && (
                    <td className="px-3 py-2 align-top" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggleSelect(submission.id)}
                        aria-label={`Select ${submission.subject}`}
                        className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--c-s2e86ab)]"
                      />
                    </td>
                  )}
                  <td className="w-full max-w-0 px-3 py-2">
                    <div className="flex items-baseline gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSubmissionClick(submission);
                        }}
                        className="truncate text-left font-semibold text-[var(--c-t1e3a5f)] hover:underline"
                      >
                        {submission.subject}
                      </button>
                      <span className="flex-shrink-0 font-mono text-[11px] text-[var(--c-t9aabbf)]">
                        {submission.trackingCode}
                      </span>
                    </div>
                    {listFields.length > 0 && (
                      <p className="mt-0.5 truncate text-[11px] text-[var(--c-t6b7b8d)]">
                        {listFields.map((item, index) => (
                          <span key={item.id}>
                            {index > 0 && ' · '}
                            <span className="font-semibold">{item.label}:</span> {item.value}
                          </span>
                        ))}
                      </p>
                    )}
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-2 text-xs text-[var(--c-t6b7b8d)] md:table-cell">
                    {submission.category}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <Badge status={submission.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-[var(--c-t6b7b8d)]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${priorityDot[submission.priority] || priorityDot.medium}`} />
                      {PRIORITY_LABEL[submission.priority] || submission.priority}
                    </span>
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-2 text-xs text-[var(--c-t6b7b8d)] lg:table-cell">
                    {assignee?.name ?? <span className="text-[var(--c-tb0bec9)]">Unassigned</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-[var(--c-t6b7b8d)]">
                    {dateFormat.format(submission.createdAt.toDate())}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 text-xs text-[var(--c-t6b7b8d)]">
          <span>
            {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(safePage - 1)}
              disabled={safePage <= 1}
              aria-label="Previous page"
              className="rounded-lg border border-[var(--c-be8ecf0)] bg-[var(--c-sffffff)] p-1.5 text-[var(--c-t2e86ab)] hover:bg-[var(--c-sebf5fb)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="font-medium">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(safePage + 1)}
              disabled={safePage >= totalPages}
              aria-label="Next page"
              className="rounded-lg border border-[var(--c-be8ecf0)] bg-[var(--c-sffffff)] p-1.5 text-[var(--c-t2e86ab)] hover:bg-[var(--c-sebf5fb)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
