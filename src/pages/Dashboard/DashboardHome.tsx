import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getCompanySubmissions, getCompanyBoards } from '../../lib/firestore';
import { useFilters } from '../../hooks/useFilters';
import type { Submission, Board } from '../../types';
import { SubmissionCard } from '../../components/Cards/SubmissionCard';
import { LoadingSpinner, Button } from '../../components/Shared';
import SubmissionDetail from '../../components/Submissions/SubmissionDetail';
import FilterBar from '../../components/Filters/FilterBar';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DashboardHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const {
    filters,
    filtered,
    activeFilterCount,
    setStatusFilter,
    setBoardFilter,
    setAssigneeFilter,
    setPriorityFilter,
    setDateRange,
    clearAllFilters,
  } = useFilters(submissions);

  const loadData = async () => {
    if (!user) return;

    try {
      const [submissionsData, boardsData] = await Promise.all([
        getCompanySubmissions(user.companyId),
        getCompanyBoards(user.companyId),
      ]);

      setSubmissions(submissionsData.sort((a, b) =>
        b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
      ));
      setBoards(boardsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1E3A5F] mb-2">
              Feedback Dashboard
            </h1>
            <p className="text-[#6B7B8D]">
              {filtered.length} of {submissions.length}{' '}
              {submissions.length === 1 ? 'submission' : 'submissions'}
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/board/create')}
            className="flex items-center gap-2"
          >
            <Plus size={20} />
            Create Board
          </Button>
        </div>
      </div>

      {boards.length > 0 && (
        <div className="mb-8">
          <FilterBar
            boards={boards}
            onStatusChange={setStatusFilter}
            onBoardChange={setBoardFilter}
            onAssigneeChange={setAssigneeFilter}
            onPriorityChange={setPriorityFilter}
            onDateRangeChange={setDateRange}
            onClear={clearAllFilters}
            activeFilterCount={activeFilterCount}
            currentFilters={filters}
          />
        </div>
      )}

      {loading ? (
        <LoadingSpinner size="lg" className="min-h-96" />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#6B7B8D] text-lg mb-4">
            {boards.length === 0
              ? 'Create your first board to start collecting feedback'
              : activeFilterCount > 0
                ? 'No submissions match your filters'
                : 'No submissions yet. Share your board QR code to get started.'}
          </p>
          {boards.length === 0 && (
            <Button
              variant="primary"
              onClick={() => navigate('/board/create')}
            >
              Create First Board
            </Button>
          )}
          {activeFilterCount > 0 && (
            <Button
              variant="secondary"
              onClick={clearAllFilters}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              onClick={setSelectedSubmission}
            />
          ))}
        </div>
      )}

      {selectedSubmission && (
        <SubmissionDetail
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onUpdated={loadData}
        />
      )}
    </div>
  );
}
