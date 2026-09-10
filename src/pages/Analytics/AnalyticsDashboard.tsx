import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, TrendingUp } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/Shared';
import { getCompanySubmissions, getCompanyBoards, getCompany, getCompanyMembers } from '../../lib/firestore';
import { MetricCard } from '../../components/Analytics/MetricCard';
import { TrendChart } from '../../components/Analytics/TrendChart';
import { PerformanceTable } from '../../components/Analytics/PerformanceTable';
import { StatusChart } from '../../components/Analytics/StatusChart';
import { PriorityChart } from '../../components/Analytics/PriorityChart';
import { CategoryChart } from '../../components/Analytics/CategoryChart';
import { SourceChart } from '../../components/Analytics/SourceChart';
import { LocationChart } from '../../components/Analytics/LocationChart';
import { LocationComparisonChart } from '../../components/Analytics/LocationComparisonChart';
import { DateRangePicker } from '../../components/Analytics/DateRangePicker';
import { ReportBuilder, type ReportOptions } from '../../components/Analytics/ReportBuilder';
import { SatisfactionAnalysisCard } from '../../components/Analytics/SatisfactionAnalysisCard';
import { calculateAnalytics, calculateSatisfactionMetrics } from '../../lib/analytics';
import { downloadPDFReport, downloadCSV } from '../../lib/export-report';
import { downloadTextFile } from '../../lib/download';
import { getDateRangePreset, isDateInRange, type DateRange } from '../../lib/date-ranges';
import { useBoardCycles } from '../../hooks/useBoardCycles';
import type { Submission, Board, Company, User } from '../../types';

function submissionCreatedAt(submission: Submission): Date | null {
  if (!submission.createdAt) return null;
  if (submission.createdAt instanceof Date) return submission.createdAt;
  return submission.createdAt.toDate();
}

export function AnalyticsDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangePreset('30days'));
  const [exportLoading, setExportLoading] = useState(false);
  const { cycles } = useBoardCycles(user?.companyId);

  useEffect(() => {
    if (!user) {
      void Promise.resolve().then(() => setLoading(false));
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [submissionsData, boardsData, companyData, membersData] = await Promise.all([
          getCompanySubmissions(user.companyId),
          getCompanyBoards(user.companyId),
          getCompany(user.companyId),
          getCompanyMembers(user.companyId),
        ]);
        setSubmissions(submissionsData);
        setBoards(boardsData);
        setCompany(companyData);
        setMembers(membersData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const metrics = calculateAnalytics(submissions, dateRange, members);
  const filteredSubmissions = submissions.filter((submission) => {
    const createdAt = submissionCreatedAt(submission);
    return createdAt ? isDateInRange(createdAt, dateRange) : false;
  });
  const companyTier = company?.subscription.tier;
  const boardMap = boards.reduce((acc, b) => {
    acc[b.id] = b.name;
    return acc;
  }, {} as Record<string, string>);
  const submissionsByLocation = Object.entries(
    filteredSubmissions.reduce((acc, submission) => {
      if (submission.location) {
        acc[submission.location] = (acc[submission.location] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count);

  const satisfactionMetrics = calculateSatisfactionMetrics(filteredSubmissions);

  const handleExportPDF = async (options?: ReportOptions) => {
    try {
      setExportLoading(true);
      await downloadPDFReport(metrics, dateRange, user.name, options);
    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExportLoading(true);
      downloadCSV(filteredSubmissions);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const handleGenerateReport = async (options: ReportOptions) => {
    try {
      setExportLoading(true);
      await downloadPDFReport(
        metrics,
        dateRange,
        user.name,
        options,
        'custom-analytics-report'
      );
    } catch (error) {
      console.error('Failed to generate custom report:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const sortedCycles = [...cycles].sort((a, b) => a.cycleNumber - b.cycleNumber);
  const maxResolutionRate = Math.max(100, ...sortedCycles.map((cycle) => cycle.stats.resolutionRate));
  const canExportCycleCsv = companyTier === 'business';

  const handleExportCycleCSV = () => {
    const rows = [
      ['Cycle', 'Board', 'Total Submissions', 'Resolved Submissions', 'Resolution Rate', 'Avg Resolution Hours'],
      ...sortedCycles.map((cycle) => [
        cycle.label,
        boardMap[cycle.boardId] || cycle.boardId,
        String(cycle.stats.totalSubmissions),
        String(cycle.stats.resolvedSubmissions),
        `${cycle.stats.resolutionRate.toFixed(1)}%`,
        cycle.stats.avgResolutionHours.toFixed(1),
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadTextFile(csv, 'board-cycle-analytics.csv', 'text/csv;charset=utf-8;');
  };

  return (
    <main className="min-h-screen bg-[var(--c-se1e8ef)]">
      <div className="bg-[var(--c-sffffff)] border-b border-[var(--c-be8ecf0)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--c-sebf5fb)] rounded-xl flex items-center justify-center">
                <TrendingUp size={20} className="text-[var(--c-t2e86ab)]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--c-t1e3a5f)]">{t('analytics.title')}</h1>
                <p className="text-sm text-[var(--c-t6b7b8d)] mt-0.5">{t('analytics.subtitle')}</p>
              </div>
            </div>
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label={t('analytics.total_submissions')}
            value={metrics.totalSubmissions}
            color="primary"
          />
          <MetricCard
            label={t('analytics.resolution_rate')}
            value={metrics.resolutionRate.toFixed(1)}
            unit="%"
            color="success"
          />
          <MetricCard
            label={t('analytics.avg_resolution_time')}
            value={metrics.averageResolutionTime.toFixed(1)}
            unit={t('analytics.days')}
            color="accent"
          />
          <MetricCard
            label={t('analytics.resolved_submissions')}
            value={metrics.resolvedSubmissions}
            color="success"
          />
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <TrendChart
            data={metrics.trendData}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            loading={false}
          />
          <StatusChart data={metrics.submissionsByStatus} loading={false} />
        </div>

        {/* Secondary Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <PriorityChart data={metrics.submissionsByPriority} loading={false} />
          <CategoryChart data={metrics.submissionsByCategory} loading={false} />
        </div>

        {/* Source and Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <SourceChart
            data={metrics.submissionsByBoard}
            boardNames={boardMap}
            loading={false}
          />
          <LocationChart data={submissionsByLocation} />
        </div>

        <div className="grid grid-cols-1 gap-8 mb-8">
          <LocationComparisonChart submissions={filteredSubmissions} />
        </div>

        {/* Satisfaction Analysis */}
        <div className="mb-8">
          <SatisfactionAnalysisCard metrics={satisfactionMetrics} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ReportBuilder
            onGenerateReport={handleGenerateReport}
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
            loading={exportLoading}
          />
        </div>

        {/* Cycle comparison */}
        {sortedCycles.length > 0 && (
          <div className="mb-8 rounded-xl border border-[var(--c-be8ecf0)] bg-[var(--c-sffffff)] p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[var(--c-t1e3a5f)]">{t('analytics.cycle_comparison')}</h2>
                <p className="text-sm text-[var(--c-t6b7b8d)]">{t('analytics.cycle_comparison_desc')}</p>
              </div>
              <button
                type="button"
                onClick={handleExportCycleCSV}
                disabled={!canExportCycleCsv}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--c-bd3d1c7)] px-3 py-2 text-sm font-semibold text-[var(--c-t2e86ab)] transition hover:bg-[var(--c-sebf5fb)] disabled:cursor-not-allowed disabled:opacity-50"
                title={canExportCycleCsv ? 'Export cycle data' : t('analytics.pro_plan_required')}
              >
                <Download size={14} />
                {t('analytics.export_csv')}
              </button>
            </div>

            <div className="mb-6 flex items-end gap-3 overflow-x-auto pb-2">
              {sortedCycles.map((cycle) => (
                <div key={cycle.id} className="flex min-w-24 flex-col items-center gap-2">
                  <div className="flex h-32 w-12 items-end rounded-lg bg-[var(--c-sf1efe8)] p-1">
                    <div
                      className="w-full rounded-md bg-[var(--c-s2e86ab)]"
                      style={{ height: `${Math.max(4, (cycle.stats.resolutionRate / maxResolutionRate) * 100)}%` }}
                    />
                  </div>
                  <span className="text-center text-xs font-semibold text-[var(--c-t1e3a5f)]">{cycle.label}</span>
                  <span className="text-xs text-[var(--c-t6b7b8d)]">{Math.round(cycle.stats.resolutionRate)}%</span>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-[var(--c-t6b7b8d)]">
                  <tr className="border-b border-[var(--c-be8ecf0)]">
                    <th className="py-2 pr-4">{t('analytics.col_cycle')}</th>
                    <th className="py-2 pr-4">{t('analytics.col_board')}</th>
                    <th className="py-2 pr-4">{t('analytics.col_submissions')}</th>
                    <th className="py-2 pr-4">{t('analytics.col_resolved')}</th>
                    <th className="py-2 pr-4">{t('analytics.col_resolution_rate')}</th>
                    <th className="py-2 pr-4">{t('analytics.col_avg_hours')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--c-bf0f4f8)] text-[var(--c-t444441)]">
                  {sortedCycles.map((cycle) => (
                    <tr key={cycle.id}>
                      <td className="py-2 pr-4 font-semibold text-[var(--c-t1e3a5f)]">{cycle.label}</td>
                      <td className="py-2 pr-4">{boardMap[cycle.boardId] || cycle.boardId}</td>
                      <td className="py-2 pr-4">{cycle.stats.totalSubmissions}</td>
                      <td className="py-2 pr-4">{cycle.stats.resolvedSubmissions}</td>
                      <td className="py-2 pr-4">{cycle.stats.resolutionRate.toFixed(1)}%</td>
                      <td className="py-2 pr-4">{cycle.stats.avgResolutionHours.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Team Performance */}
        <div className="mb-8">
          <PerformanceTable data={metrics.teamPerformance} loading={false} />
        </div>

        {/* Filter Information */}
        <div className="bg-[var(--c-sffffff)] rounded-xl border border-[var(--c-be8ecf0)] p-6 border-l-4 border-l-[#2E86AB]">
          <div className="flex items-start gap-3">
            <TrendingUp className="text-[var(--c-t2e86ab)] flex-shrink-0 mt-1" size={20} />
            <div>
              <h3 className="font-semibold text-[var(--c-t1e3a5f)] mb-1">{t('analytics.about_title')}</h3>
              <p className="text-[var(--c-t6b7b8d)] text-sm">
                {t('analytics.about_desc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
