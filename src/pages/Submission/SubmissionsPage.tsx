import { useCallback, useEffect, useState } from 'react';
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

  const loadData = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const assignedSubmissions = submissions.filter((submission) => submission.assignedTo);
  const unassignedCount = submissions.length - assignedSubmissions.length;

  const memberProgress = users
    .map((member) => {
      const ownedSubmissions = submissions.filter(
        (submission) => submission.assignedTo === member.id,
      );
      const resolvedCount = ownedSubmissions.filter(
        (submission) =>
          submission.status === 'resolved' || submission.status === 'closed',
      ).length;

      return {
        member,
        assignedCount: ownedSubmissions.length,
        resolvedCount,
        activeCount: ownedSubmissions.length - resolvedCount,
      };
    })
    .filter((item) => item.assignedCount > 0)
    .sort((a, b) => b.assignedCount - a.assignedCount);

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
          <div className="space-y-6">
            <section className="bg-white border border-[#E8ECF0] rounded-xl p-5">
              <div className="flex flex-col gap-1 mb-4">
                <h2 className="text-lg font-semibold text-[#1E3A5F]">
                  Team assignment progress
                </h2>
                <p className="text-sm text-[#6B7B8D]">
                  Track how many submissions are assigned, active, and resolved
                  for each member.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <div className="rounded-lg bg-[#EBF5FB] p-4">
                  <p className="text-xs text-[#2E86AB] uppercase tracking-wide font-semibold">
                    Total submissions
                  </p>
                  <p className="text-2xl font-bold text-[#1E3A5F]">{submissions.length}</p>
                </div>
                <div className="rounded-lg bg-[#EAF7F0] p-4">
                  <p className="text-xs text-[#2C8C5A] uppercase tracking-wide font-semibold">
                    Assigned
                  </p>
                  <p className="text-2xl font-bold text-[#1E3A5F]">{assignedSubmissions.length}</p>
                </div>
                <div className="rounded-lg bg-[#FFF4E5] p-4">
                  <p className="text-xs text-[#B5741E] uppercase tracking-wide font-semibold">
                    Unassigned
                  </p>
                  <p className="text-2xl font-bold text-[#1E3A5F]">{unassignedCount}</p>
                </div>
              </div>

              {memberProgress.length > 0 ? (
                <div className="space-y-3">
                  {memberProgress.map(({ member, assignedCount, resolvedCount, activeCount }) => {
                    const resolvedPct = Math.round((resolvedCount / assignedCount) * 100);
                    return (
                      <div
                        key={member.id}
                        className="border border-[#E8ECF0] rounded-lg p-4 bg-[#FCFDFE]"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <p className="font-medium text-[#1E3A5F]">{member.name}</p>
                          <p className="text-xs text-[#6B7B8D]">
                            {resolvedCount}/{assignedCount} resolved ({resolvedPct}%)
                          </p>
                        </div>
                        <div className="h-2.5 bg-[#E8ECF0] rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full bg-[#2C8C5A] transition-all"
                            style={{ width: `${resolvedPct}%` }}
                          />
                        </div>
                        <p className="text-xs text-[#6B7B8D]">
                          Active: {activeCount} • Resolved/Closed: {resolvedCount}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-[#6B7B8D]">
                  No submissions are assigned yet. Assign submissions to members
                  to start tracking progress.
                </p>
              )}
            </section>

            <AdvancedSearch
              submissions={submissions}
              users={users}
              onSubmissionClick={setSelectedSubmission}
            />
          </div>
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
