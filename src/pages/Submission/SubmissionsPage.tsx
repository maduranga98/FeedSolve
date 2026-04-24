import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getCompanySubmissions, getCompanyMembers } from '../../lib/firestore';
import type { Submission, User } from '../../types';
import { LoadingSpinner } from '../../components/Shared';
import { AdvancedSearch } from '../../components/Filters/AdvancedSearch';
import SubmissionDetail from '../../components/Submissions/SubmissionDetail';
import { Users, Inbox, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

function StatCard({
  label,
  value,
  icon,
  bg,
  iconColor,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  bg: string;
  iconColor: string;
}) {
  return (
    <div className={`rounded-2xl ${bg} p-5 flex items-center gap-4`}>
      <div className={`p-2.5 rounded-xl bg-white/60 ${iconColor}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-[#1E3A5F]">{value}</p>
        <p className="text-xs font-medium text-[#6B7B8D] mt-0.5">{label}</p>
      </div>
    </div>
  );
}

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
    loadData();
  }, [loadData]);

  const totalCount = submissions.length;
  const newCount = submissions.filter(s => s.status === 'received').length;
  const inProgressCount = submissions.filter(s => s.status === 'in_progress').length;
  const resolvedCount = submissions.filter(s => s.status === 'resolved' || s.status === 'closed').length;
  const assignedCount = submissions.filter(s => s.assignedTo).length;
  const unassignedCount = totalCount - assignedCount;

  const memberProgress = users
    .map(member => {
      const owned = submissions.filter(s => s.assignedTo === member.id);
      const resolved = owned.filter(s => s.status === 'resolved' || s.status === 'closed').length;
      return { member, total: owned.length, resolved, active: owned.length - resolved };
    })
    .filter(item => item.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div className="min-h-screen bg-[#F4F7FA]">
      {/* Page header */}
      <div className="bg-white border-b border-[#E8ECF0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-[#1E3A5F]">Submissions</h1>
              <p className="text-sm text-[#6B7B8D] mt-0.5">
                Review, assign, and track all feedback in one place.
              </p>
            </div>
            {!loading && totalCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBF5FB] text-[#1E6A9A] text-sm font-semibold rounded-full">
                <Inbox size={14} />
                {totalCount} total
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                label="New"
                value={newCount}
                icon={<Inbox size={18} />}
                bg="bg-[#EBF5FB]"
                iconColor="text-[#2E86AB]"
              />
              <StatCard
                label="In Progress"
                value={inProgressCount}
                icon={<Clock size={18} />}
                bg="bg-[#FFF8E6]"
                iconColor="text-[#B06F00]"
              />
              <StatCard
                label="Resolved"
                value={resolvedCount}
                icon={<CheckCircle2 size={18} />}
                bg="bg-[#EAF9F2]"
                iconColor="text-[#1D8A57]"
              />
              <StatCard
                label="Unassigned"
                value={unassignedCount}
                icon={<Users size={18} />}
                bg={unassignedCount > 0 ? "bg-[#FFF3E0]" : "bg-[#F4F7FA]"}
                iconColor={unassignedCount > 0 ? "text-[#B06F00]" : "text-[#6B7B8D]"}
              />
            </div>

            {/* Team progress */}
            {memberProgress.length > 0 && (
              <div className="bg-white border border-[#E8ECF0] rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-[#F0F4F8] flex items-center gap-2">
                  <TrendingUp size={16} className="text-[#2E86AB]" />
                  <h2 className="text-sm font-semibold text-[#1E3A5F]">Team Progress</h2>
                  <span className="ml-auto text-xs text-[#9AABBF]">{assignedCount} assigned</span>
                </div>
                <div className="divide-y divide-[#F0F4F8]">
                  {memberProgress.map(({ member, total, resolved, active }) => {
                    const pct = Math.round((resolved / total) * 100);
                    return (
                      <div key={member.id} className="px-6 py-4 flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-[#EBF5FB] flex items-center justify-center text-sm font-bold text-[#2E86AB] flex-shrink-0">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-sm font-medium text-[#1E3A5F] truncate">{member.name}</p>
                            <span className="text-xs text-[#6B7B8D] ml-2 flex-shrink-0">
                              {resolved}/{total} resolved
                            </span>
                          </div>
                          <div className="h-1.5 bg-[#EDF2F7] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                background: pct === 100
                                  ? '#1D8A57'
                                  : 'linear-gradient(90deg, #2E86AB, #3AABCE)',
                              }}
                            />
                          </div>
                          <div className="flex gap-3 mt-1">
                            <span className="text-xs text-[#9AABBF]">Active: {active}</span>
                            <span className="text-xs text-[#9AABBF]">Done: {resolved}</span>
                            <span className="text-xs font-medium text-[#2E86AB] ml-auto">{pct}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Search & results */}
            <div className="bg-white border border-[#E8ECF0] rounded-2xl p-6">
              <AdvancedSearch
                submissions={submissions}
                users={users}
                onSubmissionClick={setSelectedSubmission}
              />
            </div>
          </>
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
