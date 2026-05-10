import { memo, useMemo, useState } from 'react';
import { SubmissionCard } from '../Cards/SubmissionCard';
import { SelectAllCheckbox } from '../Submissions/SelectAllCheckbox';
import type { Submission, User } from '../../types';
import { LayoutGrid, Rows3, ChevronLeft, ChevronRight } from 'lucide-react';

interface SearchResultsProps {
  results: Submission[];
  loading?: boolean;
  onSubmissionClick: (submission: Submission) => void;
  usersMap?: Record<string, User>;
  page: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  selectedIds?: Set<string>;
  isSelectionMode?: boolean;
  onToggleSelect?: (id: string) => void;
  onSelectAll?: (ids: string[]) => void;
}

const statusPill = (
  label: string,
  count: number,
  bg: string,
  text: string
) =>
  count > 0 ? (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${bg} ${text}`}>
      {count} {label}
    </span>
  ) : null;

export const SearchResults = memo(function SearchResults({
  results,
  loading = false,
  onSubmissionClick,
  usersMap,
  page,
  pageSize = 20,
  onPageChange,
  selectedIds,
  isSelectionMode = false,
  onToggleSelect,
  onSelectAll,
}: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const totalPages = Math.ceil(results.length / pageSize);
  const safePage = Math.min(Math.max(1, page), Math.max(1, totalPages));
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;

  const paginatedResults = useMemo(
    () => results.slice(start, end),
    [results, start, end]
  );

  const statusSummary = useMemo(() => ({
    received: results.filter((s) => s.status === 'received').length,
    inProgress: results.filter((s) => s.status === 'in_progress' || s.status === 'in_review').length,
    resolved: results.filter((s) => s.status === 'resolved' || s.status === 'closed').length,
  }), [results]);

  const allResultIds = useMemo(() => results.map((s) => s.id), [results]);
  const allSelected = allResultIds.length > 0 && allResultIds.every((id) => selectedIds?.has(id));
  const someSelected = allResultIds.some((id) => selectedIds?.has(id));

  const handleSelectAllChange = (checked: boolean) => {
    onSelectAll?.(checked ? allResultIds : []);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E86AB]" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-14 h-14 bg-[#F0F4F8] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Rows3 size={24} className="text-[#9AABBF]" />
        </div>
        <p className="text-[#6B7B8D] font-semibold mb-1">No submissions found</p>
        <p className="text-[#9AABBF] text-sm">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          {onToggleSelect && (isSelectionMode || someSelected) && (
            <SelectAllCheckbox
              isChecked={allSelected}
              isIndeterminate={someSelected && !allSelected}
              onChange={handleSelectAllChange}
              title={allSelected ? 'Deselect all' : 'Select all'}
            />
          )}
          <p className="text-sm font-medium text-[#6B7B8D]">
            {results.length} submission{results.length !== 1 ? 's' : ''}
            {totalPages > 1 && (
              <span className="text-[#9AABBF] ml-1.5">· page {safePage}/{totalPages}</span>
            )}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {statusPill('new', statusSummary.received, 'bg-[#EBF5FB]', 'text-[#1E6A9A]')}
            {statusPill('in progress', statusSummary.inProgress, 'bg-[#FFF8E6]', 'text-[#B06F00]')}
            {statusPill('resolved', statusSummary.resolved, 'bg-[#EAF9F2]', 'text-[#1D8A57]')}
          </div>
        </div>

        {/* View toggle */}
        <div className="inline-flex items-center bg-[#F0F4F8] rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-1.5 ${
              viewMode === 'grid' ? 'bg-white text-[#1E3A5F] shadow-sm' : 'text-[#9AABBF] hover:text-[#6B7B8D]'
            }`}
          >
            <LayoutGrid size={13} />
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-1.5 ${
              viewMode === 'list' ? 'bg-white text-[#1E3A5F] shadow-sm' : 'text-[#9AABBF] hover:text-[#6B7B8D]'
            }`}
          >
            <Rows3 size={13} />
            List
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-2.5'}>
        {paginatedResults.map((submission) => (
          <SubmissionCard
            key={submission.id}
            submission={submission}
            onClick={() => onSubmissionClick(submission)}
            compact={viewMode === 'list'}
            usersMap={usersMap}
            isSelected={selectedIds?.has(submission.id) ?? false}
            isSelectionMode={isSelectionMode}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border border-[#E8ECF0] bg-white text-[#2E86AB] hover:bg-[#EBF5FB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
            Prev
          </button>
          <span className="text-sm text-[#6B7B8D] font-medium px-2">
            {safePage} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border border-[#E8ECF0] bg-white text-[#2E86AB] hover:bg-[#EBF5FB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
});
