import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getCompanySubmissions, getCompanyBoards } from '../../lib/firestore';
import type { Submission, Board } from '../../types';
import { SubmissionCard } from '../../components/Cards/SubmissionCard';
import { LoadingSpinner, Button, Select } from '../../components/Shared';
import SubmissionDetail from '../../components/Submissions/SubmissionDetail';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DashboardHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBoard, setSelectedBoard] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

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

  const filteredSubmissions =
    selectedBoard === 'all'
      ? submissions
      : submissions.filter((s) => s.boardId === selectedBoard);

  const boardOptions = [
    { value: 'all', label: 'All Boards' },
    ...boards.map((board) => ({ value: board.id, label: board.name })),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1E3A5F] mb-2">
              Feedback Dashboard
            </h1>
            <p className="text-[#6B7B8D]">
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
        <div className="mb-8 max-w-xs">
          <Select
            label="Filter by Board"
            value={selectedBoard}
            onChange={(e) => setSelectedBoard(e.target.value)}
            options={boardOptions}
          />
        </div>
      )}

      {loading ? (
        <LoadingSpinner size="lg" className="min-h-96" />
      ) : filteredSubmissions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#6B7B8D] text-lg mb-4">
            {boards.length === 0
              ? 'Create your first board to start collecting feedback'
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
