import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { useSubmissionSelection } from '../../hooks/useSubmissionSelection';
import {
  getCompanySubmissionsPage,
  getCompanyMembers,
  getCompanyBoards,
  updateSubmissionStatus,
  addAuditLog,
} from '../../lib/firestore';
import { downloadCSV } from '../../lib/export-report';
import type { SubmissionsPage as SubmissionsPageResult } from '../../lib/firestore';
import type { Board, Submission, User } from '../../types';
import { LoadingSpinner } from '../../components/Shared';
import { AdvancedSearch, type SubmissionsView } from '../../components/Filters/AdvancedSearch';
import SubmissionDetail from '../../components/Submissions/SubmissionDetail';
import { AddSubmissionModal } from '../../components/Submissions/AddSubmissionModal';
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
  Plus,
  Columns3,
  Table2,
  LayoutGrid,
} from 'lucide-react';

// Loaded per request. The board and table views are built for volume, so pages are larger
// than the card grid's on-screen page size.
const PAGE_SIZE = 60;

const VIEW_STORAGE_KEY = 'feedsolve_submissions_view';
const VIEWS: Array<{ id: SubmissionsView; labelKey: string; fallback: string; icon: typeof Columns3 }> = [
  { id: 'board', labelKey: 'submissions_page.view_board', fallback: 'Board', icon: Columns3 },
  { id: 'table', labelKey: 'submissions_page.view_table', fallback: 'Table', icon: Table2 },
  { id: 'cards', labelKey: 'submissions_page.view_cards', fallback: 'Cards', icon: LayoutGrid },
];

function readStoredView(): SubmissionsView {
  try {
    const stored = localStorage.getItem(VIEW_STORAGE_KEY);
    if (stored === 'board' || stored === 'table' || stored === 'cards') return stored;
  } catch {
    // storage unavailable: fall through to the default
  }
  return 'board';
}

type Tab = 'active' | 'completed';

const ACTIVE_STATUSES: Submission['status'][] = ['received', 'in_review', 'in_progress', 'escalated'];
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
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${bg} ${border}`}>
      <span className="text-[var(--c-t78716c)]">{icon}</span>
      <span className="truncate text-xs font-semibold text-[var(--c-t78716c)]">{label}</span>
      <span className={`ml-auto text-base font-bold ${valueCls}`}>{value}</span>
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
          ? 'bg-[var(--c-s1c1917)] text-white shadow-sm'
          : 'bg-[var(--c-sffffff)] text-[var(--c-t78716c)] border border-[var(--c-be9e0d9)] hover:bg-[var(--c-sf5e6df)] hover:text-[var(--c-tc0694a)] hover:border-[var(--c-bc0694a)]'
      }`}
    >
      {children}
      <span
        className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
          active ? 'bg-white/20 text-white' : 'bg-[var(--c-sf2ece6)] text-[var(--c-t78716c)]'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

export function SubmissionsPage() {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const { hasPermissionTo } = usePermissions();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [showTeamProgress, setShowTeamProgress] = useState(false);
  const [showMerged, setShowMerged] = useState(false);
  const [addBoards, setAddBoards] = useState<Board[] | null>(null);
  const [openingAdd, setOpeningAdd] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<CycleSelection>('current');
  const [view, setView] = useState<SubmissionsView>(readStoredView);
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
    document.title = `${t('submissions_page.title')} | FeedSolve`;
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadInitial());
  }, [loadInitial]);

  // Same roles that can manage submissions under firestore.rules (owner, admin, manager).
  const canAddSubmission = hasPermissionTo('submissions:update');

  const handleOpenAddSubmission = useCallback(async () => {
    if (!user || openingAdd) return;
    setOpeningAdd(true);
    try {
      const boards = await getCompanyBoards(user.companyId);
      if (boards.length === 0) {
        toast.error(t('submissions_page.no_boards'));
        return;
      }
      setAddBoards(boards);
    } catch (error) {
      console.error('Failed to load boards:', error);
      toast.error(t('submissions_page.boards_load_failed'));
    } finally {
      setOpeningAdd(false);
    }
  }, [user, openingAdd, t]);

  const handleViewChange = useCallback((next: SubmissionsView) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // preference simply isn't remembered
    }
  }, []);

  // Board drag-and-drop: update the card immediately, then persist. Reverts on failure.
  const handleStatusChange = useCallback(
    async (submission: Submission, status: Submission['status']) => {
      if (!user) return;
      const previous = submission.status;
      setSubmissions((prev) => prev.map((s) => (s.id === submission.id ? { ...s, status } : s)));
      try {
        await updateSubmissionStatus(submission.id, status);
        void addAuditLog(user.companyId, {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          action: `Changed status to "${status}"`,
          resourceType: 'submission',
          resourceId: submission.id,
          resourceName: submission.subject,
          details: { from: previous, to: status },
        }).catch((err) => console.error('Failed to write audit log:', err));
      } catch (error) {
        console.error('Failed to update status:', error);
        setSubmissions((prev) => prev.map((s) => (s.id === submission.id ? { ...s, status: previous } : s)));
        toast.error(t('submissions_page.status_update_failed', { defaultValue: "Couldn't update the status. Please try again." }));
      }
    },
    [user, t]
  );

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

  // The board lays every status out side by side, so the Active/Completed split only
  // applies to the table and card views.
  const isBoardView = view === 'board';
  const displayedSubmissions = isBoardView
    ? visibleSubmissions
    : activeTab === 'active'
      ? activeSubmissions
      : completedSubmissions;
  const canChangeStatus = hasPermissionTo('submissions:update');
  const contentWidth = isBoardView ? 'max-w-none' : 'max-w-7xl';

  return (
    <div className="fs-viewport flex flex-col bg-[var(--c-sf2ede7)] overflow-hidden">

      {/* ── Fixed top header ── */}
      <div className="bg-[var(--c-sffffff)] border-b border-[var(--c-be9e0d9)] flex-shrink-0 shadow-sm">
        <div className={`${contentWidth} mx-auto px-4 sm:px-6 lg:px-8 py-3`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[var(--c-sf5e6df)] rounded-xl flex items-center justify-center flex-shrink-0">
                <Inbox size={18} className="text-[var(--c-tc0694a)]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--c-t1c1917)] leading-tight">{t('submissions_page.title')}</h1>
                <p className="text-xs text-[var(--c-t8f8680)] mt-0.5">{t('submissions_page.subtitle')}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {canAddSubmission && (
                <button
                  onClick={handleOpenAddSubmission}
                  disabled={openingAdd}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--c-t1c1917)] bg-[var(--c-sffffff)] border border-[var(--c-bd6cabf)] hover:bg-[var(--c-sf5e6df)] hover:border-[var(--c-bc0694a)] rounded-lg transition-colors disabled:opacity-50"
                >
                  <Plus size={13} />
                  {t('submissions_page.add_submission')}
                </button>
              )}
              <button
                onClick={loadInitial}
                disabled={loading}
                title={t('refresh')}
                className="p-2 rounded-lg bg-[var(--c-sffffff)] border border-[var(--c-be9e0d9)] text-[var(--c-t78716c)] hover:bg-[var(--c-sf2ece6)] transition-colors disabled:opacity-50"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => downloadCSV(displayedSubmissions)}
                disabled={displayedSubmissions.length === 0}
                title={t('submissions_page.export_tooltip')}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-[var(--c-sc0694a)] hover:bg-[var(--c-s9c4a2f)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={13} />
                <span className="hidden sm:inline">{t('submissions_page.export_csv')}</span>
                <span className="sm:hidden">{t('submissions_page.csv')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className={`flex-1 overflow-y-auto min-h-0 ${isSelectionMode ? 'pb-24' : ''}`}>
        <div className={`${contentWidth} mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3`}>

          {loading ? (
            <div className="flex items-center justify-center py-40">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {/* ── Metric cards ── */}
              {totalCount > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <MetricCard
                    value={newCount}
                    label={t('submissions_page.new')}
                    icon={<Inbox size={13} />}
                    valueCls="text-[var(--c-t9c4a2f)]"
                    bg="bg-[var(--c-sf5e6df)]"
                    border="border-[var(--c-becd3c6)]"
                  />
                  <MetricCard
                    value={inProgressCount}
                    label={t('submissions_page.in_progress')}
                    icon={<Clock size={13} />}
                    valueCls="text-[var(--c-tb06f00)]"
                    bg="bg-[var(--c-sfff8e6)]"
                    border="border-[var(--c-bf5d78e)]"
                  />
                  <MetricCard
                    value={resolvedCount}
                    label={t('submissions_page.resolved')}
                    icon={<CheckCircle2 size={13} />}
                    valueCls="text-[var(--c-t1d8a57)]"
                    bg="bg-[var(--c-seaf9f2)]"
                    border="border-[var(--c-ba8e6c6)]"
                  />
                  <MetricCard
                    value={unassignedCount}
                    label={t('submissions_page.unassigned')}
                    icon={<Users size={13} />}
                    valueCls={unassignedCount > 0 ? 'text-[var(--c-tb06f00)]' : 'text-[var(--c-t1c1917)]'}
                    bg={unassignedCount > 0 ? 'bg-[var(--c-sfff3e0)]' : 'bg-[var(--c-sf2ece6)]'}
                    border={unassignedCount > 0 ? 'border-[var(--c-bffcc80)]' : 'border-[var(--c-be9e0d9)]'}
                  />
                </div>
              )}

              {/* ── Team Progress (collapsible) ── */}
              {memberProgress.length > 0 && (
                <div className="bg-[var(--c-sffffff)] border border-[var(--c-be9e0d9)] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowTeamProgress(!showTeamProgress)}
                    className="w-full px-4 py-2.5 flex items-center gap-2.5 hover:bg-[var(--c-sfaf8f5)] transition-colors text-left"
                  >
                    <TrendingUp size={14} className="text-[var(--c-tc0694a)]" />
                    <span className="text-sm font-semibold text-[var(--c-t1c1917)]">{t('submissions_page.team_progress')}</span>
                    <span className="text-xs text-[var(--c-t8f8680)]">
                      {assignedCount} {t('submissions_page.assigned')} · {memberProgress.length} {t('submissions_page.members')}
                      {mySubmissions.length > 0 && (
                        <> · {t('submissions_page.my_assigned')} {myPct}%</>
                      )}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`ml-auto text-[var(--c-t8f8680)] transition-transform duration-200 ${showTeamProgress ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {showTeamProgress && (
                    <div className="divide-y divide-[var(--c-bf2ece6)] border-t border-[var(--c-bf2ece6)]">
                      {mySubmissions.length > 0 && (
                        <div className="px-5 py-3.5">
                        <div className="flex items-center gap-2 mb-2">
                          <UserCheck size={14} className="text-[var(--c-tc0694a)] flex-shrink-0" />
                          <span className="text-sm font-semibold text-[var(--c-t1c1917)]">{t('submissions_page.my_assigned')}</span>
                          <span className="text-sm font-bold text-[var(--c-tc0694a)] ml-auto flex-shrink-0">{myPct}%</span>
                        </div>
                        <div className="h-2 bg-[var(--c-sf0e9e3)] rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${myPct}%`,
                              background: myPct === 100 ? '#1D8A57' : 'linear-gradient(90deg, #c0694a, #d98a68)',
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[var(--c-t8f8680)]">
                          <span className="flex items-center gap-1">
                            <AlertCircle size={11} className="text-[var(--c-tb06f00)]" />
                            {mySubmissions.length - myResolved} {t('submissions_page.active')}
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 size={11} className="text-[var(--c-t1d8a57)]" />
                            {myResolved} {t('submissions_page.done')}
                          </span>
                        </div>
                        </div>
                      )}
                      {memberProgress.map(({ member, total, resolved, active }) => {
                        const pct = Math.round((resolved / total) * 100);
                        const isMe = member.id === user?.id;
                        return (
                          <div key={member.id} className="px-5 py-3.5 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[var(--c-sf5e6df)] flex items-center justify-center text-xs font-bold text-[var(--c-tc0694a)] flex-shrink-0">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1.5">
                                <p className="text-sm font-medium text-[var(--c-t1c1917)] truncate">
                                  {member.name}
                                  {isMe && (
                                    <span className="ml-1.5 text-xs text-[var(--c-tc0694a)] font-normal">{t('submissions_page.you')}</span>
                                  )}
                                </p>
                                <span className="text-xs text-[var(--c-t78716c)] ml-2 flex-shrink-0">
                                  {resolved}/{total} · {pct}%
                                </span>
                              </div>
                              <div className="h-1.5 bg-[var(--c-sf0e9e3)] rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${pct}%`,
                                    background:
                                      pct === 100
                                        ? '#1D8A57'
                                        : 'linear-gradient(90deg, #c0694a, #d98a68)',
                                  }}
                                />
                              </div>
                            </div>
                            <span className="text-xs text-[var(--c-t8f8680)] flex-shrink-0 w-16 text-right">
                              {active} {t('submissions_page.active')}
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
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--c-be9e0d9)] bg-[var(--c-sffffff)] px-5 py-3.5">
                    <div>
                      <p className="text-sm font-bold text-[var(--c-t1c1917)]">{t('submissions_page.board_cycles')}</p>
                      <p className="text-xs text-[var(--c-t8f8680)]">{t('submissions_page.board_cycles_help')}</p>
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
                <div
                  role="tablist"
                  aria-label={t('submissions_page.view_label', { defaultValue: 'View' })}
                  className="inline-flex rounded-xl border border-[var(--c-be9e0d9)] bg-[var(--c-sffffff)] p-1"
                >
                  {VIEWS.map(({ id, labelKey, fallback, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={view === id}
                      onClick={() => handleViewChange(id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        view === id
                          ? 'bg-[var(--c-s1c1917)] text-white'
                          : 'text-[var(--c-t78716c)] hover:bg-[var(--c-sf5e6df)] hover:text-[var(--c-tc0694a)]'
                      }`}
                    >
                      <Icon size={13} />
                      {t(labelKey, { defaultValue: fallback })}
                    </button>
                  ))}
                </div>

                {!isBoardView && (
                  <div className="flex items-center gap-2">
                    <TabButton
                      active={activeTab === 'active'}
                      onClick={() => handleTabChange('active')}
                      count={activeSubmissions.length}
                    >
                      <ListChecks size={14} />
                      {t('submissions_page.tab_active')}
                    </TabButton>
                    <TabButton
                      active={activeTab === 'completed'}
                      onClick={() => handleTabChange('completed')}
                      count={completedSubmissions.length}
                    >
                      <CheckCircle2 size={14} />
                      {t('submissions_page.tab_completed')}
                    </TabButton>
                  </div>
                )}

                <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
                  {mergedCount > 0 && (
                    <label className="inline-flex items-center gap-2 rounded-lg border border-[var(--c-be9e0d9)] bg-[var(--c-sffffff)] px-3 py-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showMerged}
                        onChange={(e) => setShowMerged(e.target.checked)}
                        className="h-4 w-4 accent-[var(--c-sc0694a)]"
                      />
                      <span className="text-xs font-semibold text-[var(--c-t78716c)]">
                        {t('submissions_page.show_merged', { count: mergedCount })}
                      </span>
                    </label>
                  )}

                  <p className="text-xs text-[var(--c-t8f8680)]">
                    {isBoardView
                      ? canChangeStatus
                        ? t('submissions_page.board_description', { defaultValue: 'Drag a card to another column to change its status' })
                        : t('submissions_page.board_description_readonly', { defaultValue: 'Every status, side by side' })
                      : activeTab === 'active'
                        ? t('submissions_page.active_description')
                        : t('submissions_page.completed_description')}
                  </p>
                </div>
              </div>

              {/* ── Search + Results panel ── */}
              <div className="bg-[var(--c-sffffff)] border border-[var(--c-be9e0d9)] rounded-2xl p-4">
                <AdvancedSearch
                  view={view}
                  onStatusChange={canChangeStatus ? handleStatusChange : undefined}
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
                <div className="flex flex-col items-center gap-1.5 pb-4">
                  <p className="text-xs text-[var(--c-t8f8680)]">
                    {t('submissions_page.loaded_count', {
                      count: submissions.length,
                      defaultValue: 'Showing the {{count}} most recent submissions',
                    })}
                  </p>
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[var(--c-sffffff)] border border-[var(--c-be9e0d9)] rounded-xl text-sm font-semibold text-[var(--c-tc0694a)] hover:bg-[var(--c-sf5e6df)] transition-colors disabled:opacity-60"
                  >
                    {loadingMore ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        {t('submissions_page.loading_more')}
                      </>
                    ) : (
                      <>
                        <ChevronDown size={14} />
                        {t('submissions_page.load_more')}
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

      {addBoards && (
        <AddSubmissionModal
          boards={addBoards}
          onClose={() => setAddBoards(null)}
          onCreated={() => {
            void loadInitial();
          }}
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
