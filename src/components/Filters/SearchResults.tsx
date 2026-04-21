import { SubmissionCard } from '../Cards/SubmissionCard';
import type { Submission } from '../../types';

interface SearchResultsProps {
  results: Submission[];
  loading?: boolean;
  onSubmissionClick: (submission: Submission) => void;
  page?: number;
  pageSize?: number;
}

export function SearchResults({
  results,
  loading = false,
  onSubmissionClick,
  page = 1,
  pageSize = 50,
}: SearchResultsProps) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedResults = results.slice(start, end);
  const totalPages = Math.ceil(results.length / pageSize);

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
      <div className="flex items-center justify-between">
        <p className="text-[#6B7B8D] text-sm">
          Showing {start + 1} to {Math.min(end, results.length)} of {results.length} results
        </p>
        {totalPages > 1 && (
          <p className="text-[#6B7B8D] text-sm">
            Page {page} of {totalPages}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedResults.map((submission) => (
          <SubmissionCard
            key={submission.id}
            submission={submission}
            onClick={() => onSubmissionClick(submission)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <p className="text-[#6B7B8D] text-sm">
            Showing page {page} of {totalPages}
          </p>
        </div>
      )}
    </div>
  );
}
