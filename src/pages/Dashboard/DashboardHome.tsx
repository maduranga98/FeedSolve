import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getCompanySubmissions, getCompanyBoards, getCompanyMembers } from '../../lib/firestore';
import { useFilters } from '../../hooks/useFilters';
import type { Submission, Board, User } from '../../types';
import { LoadingSpinner, Button } from '../../components/Shared';
import SubmissionDetail from '../../components/Submissions/SubmissionDetail';
import { UsageOverview } from '../../components/Dashboard/UsageOverview';
import { AdvancedSearch } from '../../components/Filters/AdvancedSearch';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DashboardHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const loadData = async () => {
    if (!user) return;

    try {
      const [submissionsData, usersData] = await Promise.all([
        getCompanySubmissions(user.companyId),
        getCompanyMembers(user.companyId),
      ]);

      setSubmissions(submissionsData.sort((a, b) =>
        b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
      ));
      setUsers(usersData);
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
            <h1 className="text-3xl font-bold text-color-primary mb-2">
              Feedback Dashboard
            </h1>
            <p className="text-color-muted-text">
              {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
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

      {/* Usage Overview */}
      <div className="mb-8">
        <UsageOverview />
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="min-h-96" />
      ) : submissions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-color-muted-text text-lg mb-4">
            Create your first board to start collecting feedback
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/board/create')}
          >
            Create First Board
          </Button>
        </div>
      ) : (
        <AdvancedSearch
          submissions={submissions}
          users={users}
          onSubmissionClick={setSelectedSubmission}
        />
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
