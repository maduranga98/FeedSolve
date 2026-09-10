import { X } from 'lucide-react';
import type { SearchFilters, Board, User } from '../../types';

interface FilterChipsProps {
  filters: SearchFilters;
  boards: Board[];
  users: User[];
  onRemoveStatus: (status: string) => void;
  onRemovePriority: (priority: string) => void;
  onRemoveBoard: (boardId: string) => void;
  onRemoveCategory: (category: string) => void;
  onRemoveLocation: (location: string) => void;
  onRemoveAssignee: () => void;
  onRemoveDateRange: () => void;
  onClearAll: () => void;
}

const statusLabels: Record<string, string> = {
  received: 'Received',
  in_review: 'In Review',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const priorityLabels: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export function FilterChips({
  filters,
  boards,
  users,
  onRemoveStatus,
  onRemovePriority,
  onRemoveBoard,
  onRemoveCategory,
  onRemoveLocation,
  onRemoveAssignee,
  onRemoveDateRange,
  onClearAll,
}: FilterChipsProps) {
  const hasActiveFilters =
    (filters.status && filters.status.length > 0) ||
    (filters.priority && filters.priority.length > 0) ||
    (filters.boardId && filters.boardId.length > 0) ||
    (filters.category && filters.category.length > 0) ||
    (filters.location && filters.location.length > 0) ||
    filters.assignedTo ||
    filters.dateRange;

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {filters.status?.map((status) => (
        <div
          key={status}
          className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--c-se0e8ef)] text-[var(--c-t1e3a5f)] rounded-full text-sm font-medium"
        >
          <span>{statusLabels[status]}</span>
          <button
            onClick={() => onRemoveStatus(status)}
            className="hover:text-[var(--c-t444441)]"
            aria-label={`Remove ${statusLabels[status]} filter`}
          >
            <X size={14} />
          </button>
        </div>
      ))}

      {filters.priority?.map((priority) => (
        <div
          key={priority}
          className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--c-se0e8ef)] text-[var(--c-t1e3a5f)] rounded-full text-sm font-medium"
        >
          <span>{priorityLabels[priority]}</span>
          <button
            onClick={() => onRemovePriority(priority)}
            className="hover:text-[var(--c-t444441)]"
            aria-label={`Remove ${priorityLabels[priority]} filter`}
          >
            <X size={14} />
          </button>
        </div>
      ))}

      {filters.boardId?.map((boardId) => {
        const board = boards.find((b) => b.id === boardId);
        return (
          <div
            key={boardId}
            className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--c-se0e8ef)] text-[var(--c-t1e3a5f)] rounded-full text-sm font-medium"
          >
            <span>{board?.name || boardId}</span>
            <button
              onClick={() => onRemoveBoard(boardId)}
              className="hover:text-[var(--c-t444441)]"
              aria-label={`Remove ${board?.name} filter`}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}

      {filters.category?.map((category) => (
        <div
          key={category}
          className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--c-se0e8ef)] text-[var(--c-t1e3a5f)] rounded-full text-sm font-medium"
        >
          <span>{category}</span>
          <button
            onClick={() => onRemoveCategory(category)}
            className="hover:text-[var(--c-t444441)]"
            aria-label={`Remove ${category} filter`}
          >
            <X size={14} />
          </button>
        </div>
      ))}


      {filters.location?.map((location) => (
        <div
          key={location}
          className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--c-seff3f6)] text-[var(--c-t6b7b8d)] rounded-full text-sm font-medium"
        >
          <span>Location: {location}</span>
          <button
            onClick={() => onRemoveLocation(location)}
            className="hover:text-[var(--c-t444441)]"
            aria-label={`Remove ${location} location filter`}
          >
            <X size={14} />
          </button>
        </div>
      ))}

      {filters.assignedTo && (
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--c-se0e8ef)] text-[var(--c-t1e3a5f)] rounded-full text-sm font-medium">
          <span>{users.find((u) => u.id === filters.assignedTo)?.name || filters.assignedTo}</span>
          <button
            onClick={onRemoveAssignee}
            className="hover:text-[var(--c-t444441)]"
            aria-label="Remove assignee filter"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {filters.dateRange && (
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--c-se0e8ef)] text-[var(--c-t1e3a5f)] rounded-full text-sm font-medium">
          <span>
            {filters.dateRange.from instanceof Date
              ? filters.dateRange.from.toLocaleDateString()
              : filters.dateRange.from.toDate().toLocaleDateString()}{' '}
            -{' '}
            {filters.dateRange.to instanceof Date
              ? filters.dateRange.to.toLocaleDateString()
              : filters.dateRange.to.toDate().toLocaleDateString()}
          </span>
          <button
            onClick={onRemoveDateRange}
            className="hover:text-[var(--c-t444441)]"
            aria-label="Remove date range filter"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {hasActiveFilters && (
        <button
          onClick={onClearAll}
          className="ml-2 px-3 py-1 text-sm font-medium text-[var(--c-t2e86ab)] hover:bg-[var(--c-se0e8ef)] rounded-full transition-colors"
        >
          Clear All
        </button>
      )}
    </div>
  );
}
