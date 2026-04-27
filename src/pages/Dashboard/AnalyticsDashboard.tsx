import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  BarChart2,
  Zap,
  Download,
  FileText,
  Lock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useHasFeature } from '../../hooks/useHasFeature';
import { LoadingSpinner } from '../../components/Shared';
import { getCompanySubmissions, getCompanyBoards } from '../../lib/firestore';
import { MetricCard } from '../../components/Analytics/MetricCard';
import { TrendChart } from '../../components/Analytics/TrendChart';
import { StatusChart } from '../../components/Analytics/StatusChart';
import { PriorityChart } from '../../components/Analytics/PriorityChart';
import { CategoryChart } from '../../components/Analytics/CategoryChart';
import { SourceChart } from '../../components/Analytics/SourceChart';
import { PerformanceTable } from '../../components/Analytics/PerformanceTable';
import { ReportBuilder, type ReportOptions } from '../../components/Analytics/ReportBuilder';
import { SLAChart } from '../../components/Analytics/SLAChart';
import { HeatmapChart } from '../../components/Analytics/HeatmapChart';
import { AnomalyChart } from '../../components/Analytics/AnomalyChart';
import { FunnelChart } from '../../components/Analytics/FunnelChart';
import { CohortTable } from '../../components/Analytics/CohortTable';
import { BoardComparisonChart } from '../../components/Analytics/BoardComparisonChart';
import { ForecastChart } from '../../components/Analytics/ForecastChart';
import {
  calculateAnalytics,
  calculateSLAMetrics,
  calculateHeatmapData,
  calculateAnomalyData,
  calculateCohortData,
  calculateBoardComparison,
  calculateForecastData,
  calculateFunnelData,
} from '../../lib/analytics';
import { analyticsLevelAtLeast } from '../../lib/tier-limits';
import { downloadPDFReport, downloadCSV } from '../../lib/export-report';
import { getDateRangePreset, type DateRange } from '../../lib/date-ranges';
import type { Submission, Board } from '../../types';

type Tab = 'overview' | 'full' | 'advanced';

// ─── Upgrade Gate ─────────────────────────────────────────────────────────────

function UpgradeGate({
  requiredTier,
  label,
}: {
  requiredTier: 'growth' | 'business';
  label: string;
}) {
  const navigate = useNavigate();
  const tierLabel = requiredTier === 'business' ? 'Pro' : 'Growth';

  return (
    <div className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 p-10 flex flex-col items-center gap-4 text-center">
      <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
        <Lock size={26} className="text-blue-500" />
      </div>
      <div>
        <p className="text-lg font-semibold text-blue-900">{label}</p>
        <p className="text-sm text-blue-700 mt-1">
          Available on the <strong>{tierLabel}</strong> plan and above
        </p>
      </div>
      <button
        onClick={() => navigate('/pricing')}
        className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
      >
        <Zap size={16} />
        Upgrade to {tierLabel}
      </button>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function AnalyticsDashboard() {
  const { user } = useAuth();
  const { getCurrentTier } = useHasFeature();
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangePreset('30days'));
  const [exportLoading, setExportLoading] = useState(false);

  const tier = getCurrentTier();
  const hasFull = analyticsLevelAtLeast(tier, 'full');
  const hasAdvanced = analyticsLevelAtLeast(tier, 'advanced');

  useEffect(() => {
    document.title = 'Analytics | FeedSolve';
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [subs, bds] = await Promise.all([
          getCompanySubmissions(user.companyId),
          getCompanyBoards(user.companyId),
        ]);
        setSubmissions(subs);
        setBoards(bds);
      } catch (err) {
        console.error('Failed to fetch analytics data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const boardMap = useMemo(
    () => boards.reduce((acc, b) => ({ ...acc, [b.id]: b.name }), {} as Record<string, string>),
    [boards]
  );

  // Core metrics (date-range filtered)
  const metrics = useMemo(
    () => calculateAnalytics(submissions, dateRange),
    [submissions, dateRange]
  );

  // Advanced metrics (computed over all available data for richness)
  const slaMetrics = useMemo(() => calculateSLAMetrics(submissions), [submissions]);
  const heatmapData = useMemo(() => calculateHeatmapData(submissions), [submissions]);
  const anomalyData = useMemo(() => calculateAnomalyData(metrics.trendData), [metrics.trendData]);
  const cohortData = useMemo(() => calculateCohortData(submissions), [submissions]);
  const boardComparison = useMemo(
    () => calculateBoardComparison(submissions, boards),
    [submissions, boards]
  );
  const forecastData = useMemo(
    () => calculateForecastData(metrics.trendData, 14),
    [metrics.trendData]
  );
  const funnelData = useMemo(() => calculateFunnelData(submissions), [submissions]);

  // Trend comparison (current vs previous period of same length)
  const trendComparison = useMemo(() => {
    const rangeMs = dateRange.to.getTime() - dateRange.from.getTime();
    const prevTo = new Date(dateRange.from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - rangeMs);
    const prevMetrics = calculateAnalytics(submissions, { from: prevFrom, to: prevTo });

    const calcTrend = (current: number, previous: number) => {
      if (previous === 0) return { direction: 'neutral' as const, percentage: 0 };
      const pct = ((current - previous) / previous) * 100;
      return {
        direction: (pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral') as 'up' | 'down' | 'neutral',
        percentage: Math.abs(pct),
      };
    };

    return {
      submissions: calcTrend(metrics.totalSubmissions, prevMetrics.totalSubmissions),
      resolutionRate: calcTrend(metrics.resolutionRate, prevMetrics.resolutionRate),
      avgTime: calcTrend(metrics.averageResolutionTime, prevMetrics.averageResolutionTime),
      resolved: calcTrend(metrics.resolvedSubmissions, prevMetrics.resolvedSubmissions),
    };
  }, [submissions, dateRange, metrics]);

  const handleExportPDF = async () => {
    try {
      setExportLoading(true);
      await downloadPDFReport(metrics, dateRange, user?.name || '');
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportCSV = () => {
    try {
      setExportLoading(true);
      downloadCSV(submissions);
    } finally {
      setExportLoading(false);
    }
  };

  const handleGenerateReport = (_options: ReportOptions) => {
    handleExportPDF();
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode; locked: boolean }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart2 size={16} />, locked: false },
    { key: 'full', label: 'Full Analytics', icon: <TrendingUp size={16} />, locked: !hasFull },
    { key: 'advanced', label: 'Advanced', icon: <Zap size={16} />, locked: !hasAdvanced },
  ];

  return (
    <main className="min-h-screen bg-color-bg">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-color-primary">Analytics & Reports</h1>
            <p className="text-color-muted-text mt-1">
              Track submissions, performance, and trends
            </p>
          </div>
          {hasFull && (
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                disabled={exportLoading}
                className="flex items-center gap-2 px-4 py-2 bg-color-surface border border-color-border rounded-lg text-sm font-medium text-color-body-text hover:bg-color-bg disabled:opacity-50 transition-colors"
              >
                <Download size={15} />
                CSV
              </button>
              <button
                onClick={handleExportPDF}
                disabled={exportLoading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <FileText size={15} />
                PDF Report
              </button>
            </div>
          )}
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 mb-8 bg-color-surface rounded-lg p-1 border border-color-border w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-color-primary text-white shadow-sm'
                  : 'text-color-body-text hover:bg-color-bg'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.locked && (
                <Lock size={12} className="opacity-60" />
              )}
            </button>
          ))}
        </div>

        {/* ── Tab: Overview ─────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Total Submissions"
                value={metrics.totalSubmissions}
                color="primary"
                trend={trendComparison.submissions}
              />
              <MetricCard
                label="Resolution Rate"
                value={`${metrics.resolutionRate.toFixed(1)}%`}
                color="success"
                trend={trendComparison.resolutionRate}
              />
              <MetricCard
                label="Avg Resolution Time"
                value={`${metrics.averageResolutionTime.toFixed(1)}d`}
                color="accent"
                trend={{
                  ...trendComparison.avgTime,
                  // For resolution time, down = better
                  direction:
                    trendComparison.avgTime.direction === 'up'
                      ? 'down'
                      : trendComparison.avgTime.direction === 'down'
                        ? 'up'
                        : 'neutral',
                }}
              />
              <MetricCard
                label="Resolved"
                value={metrics.resolvedSubmissions}
                color="success"
                trend={trendComparison.resolved}
              />
            </div>

            {/* Trend + Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <TrendChart
                data={metrics.trendData}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
              <StatusChart data={metrics.submissionsByStatus} />
            </div>

            {/* Info banner */}
            <div className="bg-color-surface rounded-lg p-5 border-l-4 border-color-primary flex items-start gap-3">
              <TrendingUp className="text-color-primary flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-semibold text-color-primary text-sm">About Overview</p>
                <p className="text-color-body-text text-sm mt-0.5">
                  Overview shows total submissions, resolution rate, and trend data for the selected date range.
                  {!hasFull && (
                    <>{' '}
                      <button
                        onClick={() => navigate('/pricing')}
                        className="text-color-primary underline font-medium"
                      >
                        Upgrade to Growth
                      </button>
                      {' '}to unlock priority breakdown, category analysis, and team performance.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Full Analytics ───────────────────────────────────────────── */}
        {activeTab === 'full' && (
          <div className="space-y-8">
            {!hasFull ? (
              <UpgradeGate requiredTier="growth" label="Full Analytics requires the Growth plan" />
            ) : (
              <>
                {/* Priority + Category */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <PriorityChart data={metrics.submissionsByPriority} />
                  <CategoryChart data={metrics.submissionsByCategory} />
                </div>

                {/* Source + Report Builder */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <SourceChart
                    data={metrics.submissionsByBoard}
                    boardNames={boardMap}
                  />
                  <ReportBuilder
                    onGenerateReport={handleGenerateReport}
                    onExportCSV={handleExportCSV}
                    onExportPDF={handleExportPDF}
                    loading={exportLoading}
                  />
                </div>

                {/* Team Performance (full width) */}
                <PerformanceTable data={metrics.teamPerformance} />
              </>
            )}
          </div>
        )}

        {/* ── Tab: Advanced ─────────────────────────────────────────────────── */}
        {activeTab === 'advanced' && (
          <div className="space-y-8">
            {!hasAdvanced ? (
              <UpgradeGate requiredTier="business" label="Advanced Analytics requires the Pro plan" />
            ) : (
              <>
                {/* Row 1: SLA + Funnel */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <SLAChart data={slaMetrics} />
                  <FunnelChart data={funnelData} />
                </div>

                {/* Row 2: Heatmap (full width) */}
                <HeatmapChart data={heatmapData} />

                {/* Row 3: Anomaly + Forecast */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <AnomalyChart data={anomalyData} />
                  <ForecastChart data={forecastData} />
                </div>

                {/* Row 4: Cohort (full width) */}
                <CohortTable data={cohortData} />

                {/* Row 5: Board Comparison (full width) */}
                <BoardComparisonChart data={boardComparison} />
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
