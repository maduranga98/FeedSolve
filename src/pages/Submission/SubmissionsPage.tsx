import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getCompanySubmissions, getCompanyMembers } from '../../lib/firestore';
import type { Submission, User } from '../../types';
import { LoadingSpinner } from '../../components/Shared';
import { AdvancedSearch } from '../../components/Filters/AdvancedSearch';
import SubmissionDetail from '../../components/Submissions/SubmissionDetail';
import {
  Users,
  Inbox,
  CheckCircle2,
  Clock,
  TrendingUp,
  ListChecks,
  UserCheck,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';

type Tab = 'active' | 'completed';

const ACTIVE_STATUSES: Submission['status'][] = ['received', 'in_review', 'in_progress'];
const COMPLETED_STATUSES: Submission['status'][] = ['resolved', 'closed'];

function StatBadge({
  label,
  value,
  icon,
  bg,
  textColor,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  bg: string;
  textColor: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${bg} ${textColor}`}>
      {icon}
      <span className="font-bold">{value}</span>
      <span className="opacity-75">{label}</span>
    </span>
  );
}

function TabButton({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
        active
          ? 'bg-[#2E86AB] text-white shadow-sm'
          : 'bg-white text-[#6B7B8D] border border-[#E8ECF0] hover:bg-[#F4F7FA]'
      }`}
    >
      {children}
      <span
        className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
          active ? 'bg-white/25 text-white' : 'bg-[#F0F4F8] text-[#6B7B8D]'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

export function SubmissionsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [showTeamProgress, setShowTeamProgress] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [submissionsData, usersData] = await Promise.all([
        getCompanySubmissions(user.companyId),
        getCompanyMembers(user.companyId),
      ]);
      setSubmissions(
        submissionsData.sort(
          (a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
        )
      );
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load submissions workspace:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    document.title = 'Submissions | FeedSolve';
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalCount = submissions.length;
  const newCount = submissions.filter((s) => s.status === 'received').length;
  const inProgressCount = submissions.filter((s) => s.status === 'in_progress').length;
  const inReviewCount = submissions.filter((s) => s.status === 'in_review').length;
  const resolvedCount = submissions.filter(
    (s) => s.status === 'resolved' || s.status === 'closed'
  ).length;
  const assignedCount = submissions.filter((s) => s.assignedTo).length;
  const unassignedCount = totalCount - assignedCount;

  const activeSubmissions = submissions.filter((s) => ACTIVE_STATUSES.includes(s.status));
  const completedSubmissions = submissions.filter((s) => COMPLETED_STATUSES.includes(s.status));

  const memberProgress = users
    .map((member) => {
      const owned = submissions.filter((s) => s.assignedTo === member.id);
      const resolved = owned.filter(
        (s) => s.status === 'resolved' || s.status === 'closed'
      ).length;
      return { member, total: owned.length, resolved, active: owned.length - resolved };
    })
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);

  const mySubmissions = user
    ? submissions.filter((s) => s.assignedTo === user.id)
    : [];
  const myResolved = mySubmissions.filter(
    (s) => s.status === 'resolved' || s.status === 'closed'
  ).length;
  const myPct =
    mySubmissions.length > 0 ? Math.round((myResolved / mySubmissions.length) * 100) : 0;

  const displayedSubmissions =
    activeTab === 'active' ? activeSubmissions : completedSubmissions;

  return (
    <div className="h-screen flex flex-col bg-[#F4F7FA] overflow-hidden">
      {/* Fixed compact header */}
      <div className="bg-white border-b border-[#E8ECF0] flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-[#1E3A5F]">Submissions</h1>
              <p className="text-xs text-[#6B7B8D] mt-0.5">Review, assign, and track all feedback in one place.</p>
            </div>

            {!loading && totalCount > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <StatBadge
                  label="new"
                  value={newCount}
                  icon={<Inbox size={11} />}
                  bg="bg-[#EBF5FB]"
                  textColor="text-[#1E6A9A]"
                />
                <StatBadge
                  label="in progress"
                  value={inReviewCount + inProgressCount}
                  icon={<Clock size={11} />}
                  bg="bg-[#FFF8E6]"
                  textColor="text-[#B06F00]"
                />
                <StatBadge
                  label="resolved"
                  value={resolvedCount}
                  icon={<CheckCircle2 size={11} />}
                  bg="bg-[#EAF9F2]"
                  textColor="text-[#1D8A57]"
                />
                {unassignedCount > 0 && (
                  <StatBadge
                    label="unassigned"
                    value={unassignedCount}
                    icon={<Users size={11} />}
                    bg="bg-[#FFF3E0]"
                    textColor="text-[#B06F00]"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {/* My assigned progress (compact) */}
              {mySubmissions.length > 0 && (
                <div className="bg-white border border-[#E8ECF0] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2.5">
                    <UserCheck size={14} className="text-[#2E86AB]" />
                    <h2 className="text-sm font-semibold text-[#1E3A5F]">My Assigned</h2>
                    <div className="flex-1 h-1.5 bg-[#EDF2F7] rounded-full overflow-hidden mx-3">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${myPct}%`,
                          background:
                            myPct === 100
                              ? '#1D8A57'
                              : 'linear-gradient(90deg, #2E86AB, #3AABCE)',
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-[#2E86AB]">{myPct}%</span>
                    <span className="text-xs text-[#9AABBF]">
                      {myResolved}/{mySubmissions.length} resolved
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-[#9AABBF]">
                    <span className="flex items-center gap-1">
                      <AlertCircle size={11} className="text-[#B06F00]" />
                      Active: {mySubmissions.length - myResolved}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={11} className="text-[#1D8A57]" />
                      Done: {myResolved}
                    </span>
                  </div>
                </div>
              )}

              {/* Team progress (collapsible) */}
              {memberProgress.length > 0 && (
                <div className="bg-white border border-[#E8ECF0] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowTeamProgress(!showTeamProgress)}
                    className="w-full px-5 py-3 flex items-center gap-2 hover:bg-[#F8FAFB] transition-colors text-left"
                  >
                    <TrendingUp size={14} className="text-[#2E86AB]" />
                    <h2 className="text-sm font-semibold text-[#1E3A5F]">Team Progress</h2>
                    <span className="text-xs text-[#9AABBF]">{assignedCount} assigned across {memberProgress.length} members</span>
                    <ChevronDown
                      size={14}
                      className={`ml-auto text-[#9AABBF] transition-transform duration-200 ${showTeamProgress ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {showTeamProgress && (
                    <div className="divide-y divide-[#F0F4F8] border-t border-[#F0F4F8]">
                      {memberProgress.map(({ member, total, resolved, active }) => {
                        const pct = Math.round((resolved / total) * 100);
                        const isMe = member.id === user?.id;
                        return (
                          <div key={member.id} className="px-5 py-3 flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-[#EBF5FB] flex items-center justify-center text-xs font-bold text-[#2E86AB] flex-shrink-0">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium text-[#1E3A5F] truncate">
                                  {member.name}
                                  {isMe && (
                                    <span className="ml-1.5 text-xs text-[#2E86AB] font-normal">(you)</span>
                                  )}
                                </p>
                                <span className="text-xs text-[#6B7B8D] ml-2 flex-shrink-0">
                                  {resolved}/{total} · {pct}%
                                </span>
                              </div>
                              <div className="h-1.5 bg-[#EDF2F7] rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${pct}%`,
                                    background:
                                      pct === 100
                                        ? '#1D8A57'
                                        : 'linear-gradient(90deg, #2E86AB, #3AABCE)',
                                  }}
                                />
                              </div>
                            </div>
                            <div className="flex gap-3 text-xs text-[#9AABBF] flex-shrink-0">
                              <span>{active} active</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tabs + description inline */}
              <div className="flex items-center gap-2 flex-wrap">
                <TabButton
                  active={activeTab === 'active'}
                  onClick={() => setActiveTab('active')}
                  count={activeSubmissions.length}
                >
                  <ListChecks size={14} />
                  Active
                </TabButton>
                <TabButton
                  active={activeTab === 'completed'}
                  onClick={() => setActiveTab('completed')}
                  count={completedSubmissions.length}
                >
                  <CheckCircle2 size={14} />
                  Completed
                </TabButton>
                <p className="ml-auto text-xs text-[#9AABBF]">
                  {activeTab === 'active'
                    ? 'New, in review, and in progress submissions'
                    : 'Resolved and closed — archived for reference'}
                </p>
              </div>

              {/* Search & results panel */}
              <div className="bg-white border border-[#E8ECF0] rounded-2xl p-5 pb-6">
                <AdvancedSearch
                  submissions={displayedSubmissions}
                  users={users}
                  onSubmissionClick={setSelectedSubmission}
                />
              </div>
            </>
          )}
        </div>
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
