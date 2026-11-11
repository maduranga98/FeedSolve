import { memo, useMemo, useState } from 'react';
import { MapPin, PenLine } from 'lucide-react';
import type { Board, Submission, User } from '../../types';
import { SUBMISSION_STATUS_ORDER, getStatusColor, getStatusLabel } from '../../lib/utils';
import { getSubmissionFieldDisplays } from '../../lib/submission-fields';

type Status = Submission['status'];

const KANBAN_STATUSES: readonly Status[] = SUBMISSION_STATUS_ORDER;

/** Cards rendered per column before "Show more"; keeps large boards responsive. */
const COLUMN_PAGE = 25;
const DRAG_TYPE = 'application/x-feedsolve-submission';

const priorityDot: Record<string, string> = {
  low: 'bg-[var(--c-s3498db)]',
  medium: 'bg-[var(--c-sf39c12)]',
  high: 'bg-[var(--c-se74c3c)]',
  critical: 'bg-[var(--c-s8b0000)]',
};

const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

interface KanbanCardProps {
  submission: Submission;
  board: Board | null;
  assignee: User | null;
  draggable: boolean;
  isSelected: boolean;
  isSelectionMode: boolean;
  onClick: (submission: Submission) => void;
  onToggleSelect?: (id: string) => void;
  onDragStateChange: (id: string | null) => void;
}

const KanbanCard = memo(function KanbanCard({
  submission,
  board,
  assignee,
  draggable,
  isSelected,
  isSelectionMode,
  onClick,
  onToggleSelect,
  onDragStateChange,
}: KanbanCardProps) {
  // Only fields flagged "show in list", so the card stays scannable.
  const listFields =
    board && submission.customFields
      ? getSubmissionFieldDisplays(board, submission, { listOnly: true, assigneeName: assignee?.name })
      : [];

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_TYPE, submission.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStateChange(submission.id);
      }}
      onDragEnd={() => onDragStateChange(null)}
      onClick={() => onClick(submission)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(submission);
        }
      }}
      className={`group rounded-lg border bg-[var(--c-sffffff)] p-3 text-left transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--c-b2e86ab)]/40 ${
        draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${
        isSelected
          ? 'border-l-[3px] border-l-[#2E86AB] border-[var(--c-bc8ddf0)]'
          : 'border-[var(--c-be8ecf0)] hover:border-[var(--c-bc8ddf0)]'
      }`}
    >
      <div className="mb-1.5 flex items-center gap-2">
        {onToggleSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(submission.id)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${submission.subject}`}
            className={`h-3.5 w-3.5 flex-shrink-0 cursor-pointer accent-[var(--c-s2e86ab)] transition-opacity ${
              isSelectionMode || isSelected ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100'
            }`}
          />
        )}
        <span className="font-mono text-[11px] text-[var(--c-t9aabbf)]">{submission.trackingCode}</span>
        {submission.source === 'internal' && (
          <PenLine size={10} className="text-[var(--c-t9aabbf)]" aria-label="Logged by a team member" />
        )}
        {submission.isMerged && (
          <span className="rounded-full bg-[var(--c-sf1efe8)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--c-t5f5e5a)]">
            Merged
          </span>
        )}
        <span
          className={`ml-auto h-2 w-2 flex-shrink-0 rounded-full ${priorityDot[submission.priority] || priorityDot.medium}`}
          title={`Priority: ${submission.priority}`}
          aria-label={`Priority: ${submission.priority}`}
        />
      </div>

      <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-[var(--c-t1e3a5f)]">{submission.subject}</p>

      {listFields.length > 0 && (
        <dl className="mt-2 space-y-0.5">
          {listFields.map((item) => (
            <div key={item.id} className="flex gap-1 text-[11px] text-[var(--c-t4a6274)]" title={`${item.label}: ${item.value}`}>
              <dt className="flex-shrink-0 font-semibold">{item.label}:</dt>
              <dd className="truncate">{item.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-2.5 flex items-center gap-1.5">
        <span className="truncate rounded-md bg-[var(--c-sebf5fb)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--c-t2e86ab)]">
          {submission.category}
        </span>
        {submission.location && (
          <span className="inline-flex min-w-0 items-center gap-0.5 text-[11px] text-[var(--c-t6b7b8d)]">
            <MapPin size={10} className="flex-shrink-0" />
            <span className="truncate">{submission.location}</span>
          </span>
        )}
        <span className="ml-auto flex-shrink-0 text-[11px] text-[var(--c-tb0bec9)]">
          {shortDate.format(submission.createdAt.toDate())}
        </span>
        {assignee && (
          <span
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--c-sf0f4f8)] text-[10px] font-bold text-[var(--c-t4a6274)]"
            title={`Assigned to ${assignee.name}`}
            aria-label={`Assigned to ${assignee.name}`}
          >
            {assignee.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
});

interface SubmissionKanbanProps {
  submissions: Submission[];
  boards?: Board[];
  usersMap?: Record<string, User>;
  onSubmissionClick: (submission: Submission) => void;
  /** When provided, cards can be dragged between columns to change status. */
  onStatusChange?: (submission: Submission, status: Status) => void;
  selectedIds?: Set<string>;
  isSelectionMode?: boolean;
  onToggleSelect?: (id: string) => void;
}

/**
 * Status board: one column per workflow status, each scrolling on its own and rendering
 * cards in pages so thousands of submissions stay usable. Dragging a card to another
 * column changes its status (HTML5 drag and drop; on touch devices status is changed
 * from the detail view instead).
 */
export function SubmissionKanban({
  submissions,
  boards,
  usersMap,
  onSubmissionClick,
  onStatusChange,
  selectedIds,
  isSelectionMode = false,
  onToggleSelect,
}: SubmissionKanbanProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<Status | null>(null);
  const [visibleCounts, setVisibleCounts] = useState<Partial<Record<Status, number>>>({});

  const boardsById = useMemo(() => new Map((boards ?? []).map((board) => [board.id, board])), [boards]);

  const columns = useMemo(() => {
    const grouped = new Map<Status, Submission[]>(KANBAN_STATUSES.map((status) => [status, []]));
    for (const submission of submissions) grouped.get(submission.status)?.push(submission);
    return grouped;
  }, [submissions]);

  const draggingSubmission = draggingId ? submissions.find((s) => s.id === draggingId) ?? null : null;

  const handleDrop = (status: Status, e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData(DRAG_TYPE);
    setDropTarget(null);
    setDraggingId(null);
    const submission = submissions.find((s) => s.id === id);
    if (submission && submission.status !== status) onStatusChange?.(submission, status);
  };

  return (
    <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
      {KANBAN_STATUSES.map((status) => {
        const items = columns.get(status) ?? [];
        const visible = visibleCounts[status] ?? COLUMN_PAGE;
        const colors = getStatusColor(status);
        const isTarget = dropTarget === status && draggingSubmission !== null && draggingSubmission.status !== status;

        return (
          <section
            key={status}
            aria-label={`${getStatusLabel(status)} (${items.length})`}
            onDragOver={(e) => {
              if (!onStatusChange || !e.dataTransfer.types.includes(DRAG_TYPE)) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (dropTarget !== status) setDropTarget(status);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropTarget(null);
            }}
            onDrop={(e) => handleDrop(status, e)}
            className={`flex max-h-[calc(100vh-15rem)] min-h-[12rem] w-[17.5rem] flex-shrink-0 snap-start flex-col rounded-xl border transition-colors ${
              isTarget
                ? 'border-[#2E86AB] bg-[var(--c-sebf5fb)]'
                : 'border-[var(--c-be9e0d9)] bg-[var(--c-sfaf8f5)]'
            }`}
          >
            <header className="flex flex-shrink-0 items-center gap-2 px-3 py-2.5">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${colors.bg} ${colors.text}`}>
                {getStatusLabel(status)}
              </span>
              <span className="text-xs font-semibold text-[var(--c-t8f8680)]">{items.length}</span>
            </header>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-2 pb-2">
              {items.slice(0, visible).map((submission) => (
                <div key={submission.id} className={draggingId === submission.id ? 'opacity-40' : undefined}>
                  <KanbanCard
                    submission={submission}
                    board={boardsById.get(submission.boardId) ?? null}
                    assignee={submission.assignedTo ? usersMap?.[submission.assignedTo] ?? null : null}
                    draggable={!!onStatusChange && !submission.isMerged}
                    isSelected={selectedIds?.has(submission.id) ?? false}
                    isSelectionMode={isSelectionMode}
                    onClick={onSubmissionClick}
                    onToggleSelect={onToggleSelect}
                    onDragStateChange={setDraggingId}
                  />
                </div>
              ))}

              {items.length === 0 && (
                <p className="px-2 py-6 text-center text-xs text-[var(--c-t8f8680)]">
                  {isTarget ? 'Drop here' : 'Nothing here'}
                </p>
              )}

              {items.length > visible && (
                <button
                  type="button"
                  onClick={() => setVisibleCounts((prev) => ({ ...prev, [status]: visible + COLUMN_PAGE }))}
                  className="w-full rounded-lg border border-dashed border-[var(--c-bd6cabf)] py-2 text-xs font-semibold text-[var(--c-t2e86ab)] hover:bg-[var(--c-sffffff)]"
                >
                  Show {Math.min(COLUMN_PAGE, items.length - visible)} more ({items.length - visible} hidden)
                </button>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
