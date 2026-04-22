import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getCompanySubmissions, getCompanyMembers } from '../../lib/firestore';
import type { Submission, User } from '../../types';
import { LoadingSpinner } from '../../components/Shared';
import { AdvancedSearch } from '../../components/Filters/AdvancedSearch';
import SubmissionDetail from '../../components/Submissions/SubmissionDetail';

export function SubmissionsPage() {
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

      setSubmissions(
        submissionsData.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime())
      );
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load submissions workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  return (
    <div className="min-h-screen bg-[#F4F7FA]">
      <div className="bg-white border-b border-[#E8ECF0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Submissions</h1>
          <p className="text-sm text-[#6B7B8D] mt-1">
            Review submitted forms, assign owners, and update status from one dedicated workspace.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <AdvancedSearch
            submissions={submissions}
            users={users}
            onSubmissionClick={setSelectedSubmission}
          />
        )}
      </div>

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
