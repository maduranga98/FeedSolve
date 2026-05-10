import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSubmissionSelection } from '../../hooks/useSubmissionSelection';
import { getCompanySubmissionsPage, getCompanyMembers } from '../../lib/firestore';
import { downloadCSV } from '../../lib/export-report';
import type { SubmissionsPage as SubmissionsPageResult } from '../../lib/firestore';
import type { Submission, User } from '../../types';
import { LoadingSpinner } from '../../components/Shared';
import { AdvancedSearch } from '../../components/Filters/AdvancedSearch';
import SubmissionDetail from '../../components/Submissions/SubmissionDetail';
import { BulkActionBar } from '../../components/Submissions/BulkActionBar';
import { CycleSwitcher, type CycleSelection } from '../../components/dashboard/CycleSwitcher';
import { CycleStatsBanner } from '../../components/dashboard/CycleStatsBanner';
import { useBoardCycles } from '../../hooks/useBoardCycles';
import type { QueryDocumentSnapshot } from 'firebase/firestore';
import {
  Users,
  Inbox,
  CheckCircle2,
  Clock,
  ListChecks,
  UserCheck,
  AlertCircle,
  ChevronDown,
  RefreshCw,
  Download,
  TrendingUp,
} from 'lucide-react';

const PAGE_SIZE = 20;

type Tab = 'active' | 'completed';

const ACTIVE_STATUSES: Submission['status'][] = ['received', 'in_review', 'in_progress'];
const COMPLETED_STATUSES: Submission['status'][] = ['resolved', 'closed'];

function MetricCard({
  value,
  label,
  icon,
  valueCls,
  bg,
  border,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
  valueCls: string;
  bg: string;
  border: string;
}) {
  return (
    <div className={`rounded-xl p-4 border ${bg} ${border}`}>
      <div className="flex items-center gap-2 mb-2 text-[#6B7B8D]">
        {icon}
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${valueCls}`}>{value}</p>
    </div>
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
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        active
          ? 'bg-[#1E3A5F] text-white shadow-sm'
          : 'bg-white text-[#6B7B8D] border border-[#E8ECF0] hover:bg-[#EBF5FB] hover:text-[#2E86AB] hover:border-[#2E86AB]'
      }`}
    >
      {children}
      <span
        className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
          active ? 'bg-white/20 text-white' : 'bg-[#F0F4F8] text-[#6B7B8D]'
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [showTeamProgress, setShowTeamProgress] = useState(false);
  const [showMerged, setShowMerged] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<CycleSelection>('current');
  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null);

  const { cycles, currentCyclesByBoard } = useBoardCycles(user?.companyId);

  const {
    selectedIds,
    selectedCount,
    isSelectionMode,
    toggleSelection,
    selectAll,
    clearSelection,
    bulkUpdateStatus,
    bulkAssign,
    bulkClose,
  } = useSubmissionSelection();

  const usersMap = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u])),
    [users]
  );

  const loadInitial = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [pageResult, usersData]: [SubmissionsPageResult, User[]] = await Promise.all([
        getCompanySubmissionsPage(user.companyId, PAGE_SIZE),
        getCompanyMembers(user.companyId),
      ]);
      setSubmissions(pageResult.submissions);
      setHasMore(pageResult.hasMore);
      lastDocRef.current = pageResult.lastDoc;
      setUsers(usersData);
      setSelectedSubmission((prev) =>
        prev ? (pageResult.submissions.find((s) => s.id === prev.id) ?? prev) : null
      );
    } catch (error) {
      console.error('Failed to load submissions workspace:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadMore = useCallback(async () => {
    if (!user || !lastDocRef.current || loadingMore) return;
    setLoadingMore(true);
    try {
      const pageResult = await getCompanySubmissionsPage(
        user.companyId,
        PAGE_SIZE,
        lastDocRef.current
      );
      setSubmissions((prev) => [...prev, ...pageResult.submissions]);
      setHasMore(pageResult.hasMore);
      lastDocRef.current = pageResult.lastDoc;
    } catch (error) {
      console.error('Failed to load more submissions:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [user, loadingMore]);

  useEffect(() => {
    document.title = 'Submissions | FeedSolve';
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadInitial());
  }, [loadInitial]);

  const handleTabChange = useCallback(
    (tab: Tab) => {
      setActiveTab(tab);
      clearSelection();
    },
    [clearSelection]
  );

  const handleBulkUpdateStatus = useCallback(
    async (status: Submission['status']) => {
      await bulkUpdateStatus(status);
      loadInitial();
    },
    [bulkUpdateStatus, loadInitial]
  );

  const handleBulkAssign = useCallback(
    async (userId: string, userName: string) => {
      await bulkAssign(userId, userName);
      loadInitial();
    },
    [bulkAssign, loadInitial]
  );

  const handleBulkClose = useCallback(async () => {
    await bulkClose();
    loadInitial();
  }, [bulkClose, loadInitial]);

  const handleSelectAll = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) clearSelection();
      else selectAll(ids);
    },
    [selectAll, clearSelection]
  );

  const totalCount = submissions.length;
  const newCount = submissions.filter((s) => s.status === 'received').length;
  const inProgressCount = submissions.filter(
    (s) => s.status === 'in_progress' || s.status === 'in_review'
  ).length;
  const resolvedCount = submissions.filter(
    (s) => s.status === 'resolved' || s.status === 'closed'
  ).length;
  const assignedCount = submissions.filter((s) => s.assignedTo).length;
  const unassignedCount = totalCount - assignedCount;

  const selectedPastCycle = cycles.find((cycle) => cycle.id === selectedCycle) ?? null;
  const cycleFilteredSubmissions = (() => {
    if (selectedCycle === 'all') return submissions;
    if (selectedCycle !== 'current') {
      return submissions.filter((submission) => submission.cycleId === selectedCycle);
    }
    return submissions.filter((submission) => {
      if (!submission.cycleId) return true;
      const currentCycle = currentCyclesByBoard.get(submission.boardId);
      return currentCycle?.id === submission.cycleId;
    });
  })();
  const visibleSubmissions = showMerged
    ? cycleFilteredSubmissions
    : cycleFilteredSubmissions.filter((s) => !s.isMerged);
  const mergedCount = cycleFilteredSubmissions.filter((s) => s.isMerged).length;
  const activeSubmissions = visibleSubmissions.filter((s) => ACTIVE_STATUSES.includes(s.status));
  const completedSubmissions = visibleSubmissions.filter((s) => COMPLETED_STATUSES.includes(s.status));

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

  const mySubmissions = user ? submissions.filter((s) => s.assignedTo === user.id) : [];
  const myResolved = mySubmissions.filter(
    (s) => s.status === 'resolved' || s.status === 'closed'
  ).length;
  const myPct = mySubmissions.length > 0 ? Math.round((myResolved / mySubmissions.length) * 100) : 0;

  const displayedSubmissions =
    activeTab === 'active' ? activeSubmissions : completedSubmissions;

  return (
    <div className="h-screen flex flex-col bg-[#EEF2F6] overflow-hidden">

      {/* ── Fixed top header ── */}
      <div className="bg-white border-b border-[#E8ECF0] flex-shrink-0 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#EBF5FB] rounded-xl flex items-center justify-center flex-shrink-0">
                <Inbox size={18} className="text-[#2E86AB]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1E3A5F] leading-tight">Submissions</h1>
                <p className="text-xs text-[#9AABBF] mt-0.5">Review, assign, and resolve feedback</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={loadInitial}
                disabled={loading}
                title="Refresh"
                className="p-2 rounded-lg bg-white border border-[#E8ECF0] text-[#6B7B8D] hover:bg-[#F0F4F8] transition-colors disabled:opacity-50"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => downloadCSV(displayedSubmissions)}
                disabled={displayedSubmissions.length === 0}
                title="Export current view as CSV"
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-[#2E86AB] hover:bg-[#1E6A9A] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={13} />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className={`flex-1 overflow-y-auto min-h-0 ${isSelectionMode ? 'pb-24' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">

          {loading ? (
            <div className="flex items-center justify-center py-40">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {/* ── Metric cards ── */}
              {totalCount > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <MetricCard
                    value={newCount}
                    label="New"
                    icon={<Inbox size={13} />}
                    valueCls="text-[#1E6A9A]"
                    bg="bg-[#EBF5FB]"
                    border="border-[#C8E0EE]"
                  />
                  <MetricCard
                    value={inProgressCount}
                    label="In Progress"
                    icon={<Clock size={13} />}
                    valueCls="text-[#B06F00]"
                    bg="bg-[#FFF8E6]"
                    border="border-[#F5D78E]"
                  />
                  <MetricCard
                    value={resolvedCount}
                    label="Resolved"
                    icon={<CheckCircle2 size={13} />}
                    valueCls="text-[#1D8A57]"
                    bg="bg-[#EAF9F2]"
                    border="border-[#A8E6C6]"
                  />
                  <MetricCard
                    value={unassignedCount}
                    label="Unassigned"
                    icon={<Users size={13} />}
                    valueCls={unassignedCount > 0 ? 'text-[#B06F00]' : 'text-[#1E3A5F]'}
                    bg={unassignedCount > 0 ? 'bg-[#FFF3E0]' : 'bg-[#F0F4F8]'}
                    border={unassignedCount > 0 ? 'border-[#FFCC80]' : 'border-[#E8ECF0]'}
                  />
                </div>
              )}

              {/* ── My Assigned ── */}
              {mySubmissions.length > 0 && (
                <div className="bg-white border border-[#E8ECF0] rounded-xl px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck size={14} className="text-[#2E86AB] flex-shrink-0" />
                    <span className="text-sm font-semibold text-[#1E3A5F]">My Assigned</span>
                    <span className="text-sm font-bold text-[#2E86AB] ml-auto flex-shrink-0">{myPct}%</span>
                  </div>
                  <div className="h-2 bg-[#EDF2F7] rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${myPct}%`,
                        background: myPct === 100 ? '#1D8A57' : 'linear-gradient(90deg, #2E86AB, #3AABCE)',
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#9AABBF]">
                    <span className="flex items-center gap-1">
                      <AlertCircle size={11} className="text-[#B06F00]" />
                      {mySubmissions.length - myResolved} active
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={11} className="text-[#1D8A57]" />
                      {myResolved} done
                    </span>
                  </div>
                </div>
              )}

              {/* ── Team Progress (collapsible) ── */}
              {memberProgress.length > 0 && (
                <div className="bg-white border border-[#E8ECF0] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowTeamProgress(!showTeamProgress)}
                    className="w-full px-5 py-3.5 flex items-center gap-2.5 hover:bg-[#F8FAFB] transition-colors text-left"
                  >
                    <TrendingUp size={14} className="text-[#2E86AB]" />
                    <span className="text-sm font-semibold text-[#1E3A5F]">Team Progress</span>
                    <span className="text-xs text-[#9AABBF]">
                      {assignedCount} assigned · {memberProgress.length} members
                    </span>
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
                          <div key={member.id} className="px-5 py-3.5 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#EBF5FB] flex items-center justify-center text-xs font-bold text-[#2E86AB] flex-shrink-0">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1.5">
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
                            <span className="text-xs text-[#9AABBF] flex-shrink-0 w-16 text-right">
                              {active} active
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Cycle selector ── */}
              {cycles.length > 0 && (
                <>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E8ECF0] bg-white px-5 py-3.5">
                    <div>
                      <p className="text-sm font-bold text-[#1E3A5F]">Board cycles</p>
                      <p className="text-xs text-[#9AABBF]">Default view shows the current cycle.</p>
                    </div>
                    <CycleSwitcher
                      cycles={cycles}
                      selectedCycle={selectedCycle}
                      onChange={(value) => {
                        setSelectedCycle(value);
                        clearSelection();
                      }}
                    />
                  </div>
                  <CycleStatsBanner cycle={selectedPastCycle} />
                </>
              )}

              {/* ── Tab bar ── */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <TabButton
                    active={activeTab === 'active'}
                    onClick={() => handleTabChange('active')}
                    count={activeSubmissions.length}
                  >
                    <ListChecks size={14} />
                    Active
                  </TabButton>
                  <TabButton
                    active={activeTab === 'completed'}
                    onClick={() => handleTabChange('completed')}
                    count={completedSubmissions.length}
                  >
                    <CheckCircle2 size={14} />
                    Completed
                  </TabButton>
                </div>

                {mergedCount > 0 && (
                  <label className="ml-auto inline-flex items-center gap-2 rounded-lg border border-[#E8ECF0] bg-white px-3 py-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showMerged}
                      onChange={(e) => setShowMerged(e.target.checked)}
                      className="h-4 w-4 accent-[#2E86AB]"
                    />
                    <span className="text-xs font-semibold text-[#6B7B8D]">
                      Show merged ({mergedCount})
                    </span>
                  </label>
                )}

                <p className="text-xs text-[#9AABBF] ml-auto">
                  {activeTab === 'active'
                    ? 'New, in review, and in progress'
                    : 'Resolved and closed'}
                </p>
              </div>

              {/* ── Search + Results panel ── */}
              <div className="bg-white border border-[#E8ECF0] rounded-2xl p-5">
                <AdvancedSearch
                  submissions={displayedSubmissions}
                  users={users}
                  usersMap={usersMap}
                  onSubmissionClick={setSelectedSubmission}
                  selectedIds={selectedIds}
                  isSelectionMode={isSelectionMode}
                  onToggleSelect={toggleSelection}
                  onSelectAll={handleSelectAll}
                />
              </div>

              {/* ── Load More ── */}
              {hasMore && (
                <div className="flex justify-center pb-4">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E8ECF0] rounded-xl text-sm font-semibold text-[#2E86AB] hover:bg-[#EBF5FB] transition-colors disabled:opacity-60"
                  >
                    {loadingMore ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Loading…
                      </>
                    ) : (
                      <>
                        <ChevronDown size={14} />
                        Load more submissions
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {isSelectionMode && (
        <BulkActionBar
          selectedCount={selectedCount}
          users={users}
          onBulkStatusChange={handleBulkUpdateStatus}
          onBulkAssign={handleBulkAssign}
          onBulkClose={handleBulkClose}
          onClear={clearSelection}
        />
      )}

      {selectedSubmission && (
        <SubmissionDetail
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onUpdated={loadInitial}
        />
      )}
    </div>
  );
}
