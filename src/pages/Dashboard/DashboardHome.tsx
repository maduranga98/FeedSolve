import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getCompanySubmissions, getCompanyBoards } from '../../lib/firestore';
import type { Submission, Board } from '../../types';
import { SubmissionCard } from '../../components/Cards/SubmissionCard';
import { LoadingSpinner, Button } from '../../components/Shared';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardFilters } from './DashboardFilters';

export function DashboardHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBoard, setSelectedBoard] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');

  useEffect(() => {
    const fetchData = async () => {
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

    fetchData();
  }, [user]);

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesBoard = selectedBoard === 'all' || submission.boardId === selectedBoard;
    const matchesStatus = !selectedStatus || submission.status === selectedStatus;
    const matchesPriority = !selectedPriority || submission.priority === selectedPriority;
    const matchesSearch =
      !searchQuery ||
      submission.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.trackingCode.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesBoard && matchesStatus && matchesPriority && matchesSearch;
  });

  const handleReset = () => {
    setSearchQuery('');
    setSelectedBoard('all');
    setSelectedStatus('');
    setSelectedPriority('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-color-primary mb-2">
              Feedback Dashboard
            </h1>
            <p className="text-color-muted-text">
              {submissions.length} total{' '}
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
        <DashboardFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedBoard={selectedBoard}
          onBoardChange={setSelectedBoard}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedPriority={selectedPriority}
          onPriorityChange={setSelectedPriority}
          boards={boards}
          onReset={handleReset}
          submissionCount={filteredSubmissions.length}
        />
      )}

      {loading ? (
        <LoadingSpinner size="lg" className="min-h-96" />
      ) : filteredSubmissions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-color-muted-text text-lg mb-4">
            {boards.length === 0
              ? 'Create your first board to start collecting feedback'
              : searchQuery || selectedBoard !== 'all' || selectedStatus || selectedPriority
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
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubmissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
            />
          ))}
        </div>
      )}
    </div>
  );
}
