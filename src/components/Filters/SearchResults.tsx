import { memo, useMemo, useState } from 'react';
import { SubmissionCard } from '../Cards/SubmissionCard';
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
}

export const SearchResults = memo(function SearchResults({
  results,
  loading = false,
  onSubmissionClick,
  usersMap,
  page,
  pageSize = 20,
  onPageChange,
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
    inProgress: results.filter((s) => s.status === 'in_progress').length,
    resolved: results.filter((s) => s.status === 'resolved').length,
  }), [results]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E86AB]" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-[#6B7B8D] text-lg mb-2">No submissions found</p>
        <p className="text-[#9BACBA] text-sm">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E8ECF0] rounded-xl p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[#6B7B8D] text-sm">
              Showing {start + 1}–{Math.min(end, results.length)} of {results.length} submissions
            </p>
            {totalPages > 1 && (
              <p className="text-[#9AABBF] text-xs mt-1">
                Page {safePage} of {totalPages}
              </p>
            )}
          </div>

          <div className="inline-flex items-center bg-[#F4F7FA] rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors inline-flex items-center gap-1.5 ${
                viewMode === 'grid' ? 'bg-white text-[#1E3A5F] shadow-sm' : 'text-[#6B7B8D]'
              }`}
            >
              <LayoutGrid size={14} />
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors inline-flex items-center gap-1.5 ${
                viewMode === 'list' ? 'bg-white text-[#1E3A5F] shadow-sm' : 'text-[#6B7B8D]'
              }`}
            >
              <Rows3 size={14} />
              List
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="rounded-lg bg-[#F4F7FA] px-3 py-2">
            <p className="text-xs text-[#6B7B8D]">New</p>
            <p className="text-lg font-semibold text-[#1E3A5F]">{statusSummary.received}</p>
          </div>
          <div className="rounded-lg bg-[#FFF8E6] px-3 py-2">
            <p className="text-xs text-[#6B7B8D]">In progress</p>
            <p className="text-lg font-semibold text-[#8A5A00]">{statusSummary.inProgress}</p>
          </div>
          <div className="rounded-lg bg-[#EAF9F2] px-3 py-2">
            <p className="text-xs text-[#6B7B8D]">Resolved</p>
            <p className="text-lg font-semibold text-[#1D6B45]">{statusSummary.resolved}</p>
          </div>
        </div>
      </div>

      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-3'}>
        {paginatedResults.map((submission) => (
          <SubmissionCard
            key={submission.id}
            submission={submission}
            onClick={() => onSubmissionClick(submission)}
            compact={viewMode === 'list'}
            usersMap={usersMap}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-[#E8ECF0] bg-white text-[#2E86AB] hover:bg-[#EBF5FB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={15} />
            Previous
          </button>
          <span className="text-sm text-[#6B7B8D] font-medium">
            {safePage} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-[#E8ECF0] bg-white text-[#2E86AB] hover:bg-[#EBF5FB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
});
