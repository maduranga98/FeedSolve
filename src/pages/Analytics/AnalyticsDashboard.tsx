import { useState, useEffect } from 'react';
import { Download, TrendingUp } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/Shared';
import { getCompanySubmissions, getCompanyBoards, getCompany } from '../../lib/firestore';
import { MetricCard } from '../../components/Analytics/MetricCard';
import { TrendChart } from '../../components/Analytics/TrendChart';
import { PerformanceTable } from '../../components/Analytics/PerformanceTable';
import { StatusChart } from '../../components/Analytics/StatusChart';
import { PriorityChart } from '../../components/Analytics/PriorityChart';
import { CategoryChart } from '../../components/Analytics/CategoryChart';
import { SourceChart } from '../../components/Analytics/SourceChart';
import { LocationChart } from '../../components/Analytics/LocationChart';
import { ReportBuilder, type ReportOptions } from '../../components/Analytics/ReportBuilder';
import { calculateAnalytics } from '../../lib/analytics';
import { downloadPDFReport, downloadCSV } from '../../lib/export-report';
import { getDateRangePreset, type DateRange } from '../../lib/date-ranges';
import { useBoardCycles } from '../../hooks/useBoardCycles';
import type { Submission, Board, Company } from '../../types';

export function AnalyticsDashboard() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
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
        const [submissionsData, boardsData, companyData] = await Promise.all([
          getCompanySubmissions(user.companyId),
          getCompanyBoards(user.companyId),
          getCompany(user.companyId),
        ]);
        setSubmissions(submissionsData);
        setBoards(boardsData);
        setCompany(companyData);
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

  const metrics = calculateAnalytics(submissions, dateRange);
  const companyTier = company?.subscription.tier;
  const boardMap = boards.reduce((acc, b) => {
    acc[b.id] = b.name;
    return acc;
  }, {} as Record<string, string>);
  const submissionsByLocation = Object.entries(
    submissions.reduce((acc, submission) => {
      if (submission.location) {
        acc[submission.location] = (acc[submission.location] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count);

  const handleExportPDF = async () => {
    try {
      setExportLoading(true);
      await downloadPDFReport(metrics, dateRange, user.name);
    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExportLoading(true);
      downloadCSV(submissions);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const handleGenerateReport = (options: ReportOptions) => {
    console.log('Generating report with options:', options);
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
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'board-cycle-analytics.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[#EEF3F7]">
      <div className="bg-white border-b border-[#E8ECF0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#EBF5FB] rounded-xl flex items-center justify-center">
              <TrendingUp size={20} className="text-[#2E86AB]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1E3A5F]">Analytics & Reports</h1>
              <p className="text-sm text-[#6B7B8D] mt-0.5">Track submissions, performance, and trends</p>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Total Submissions"
            value={metrics.totalSubmissions}
            color="primary"
          />
          <MetricCard
            label="Resolution Rate"
            value={metrics.resolutionRate.toFixed(1)}
            unit="%"
            color="success"
          />
          <MetricCard
            label="Avg Resolution Time"
            value={metrics.averageResolutionTime.toFixed(1)}
            unit="days"
            color="accent"
          />
          <MetricCard
            label="Resolved Submissions"
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
          <div className="mb-8 rounded-xl border border-[#E8ECF0] bg-white p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#1E3A5F]">Cycle Comparison</h2>
                <p className="text-sm text-[#6B7B8D]">Resolution rate by board cycle.</p>
              </div>
              <button
                type="button"
                onClick={handleExportCycleCSV}
                disabled={!canExportCycleCsv}
                className="inline-flex items-center gap-2 rounded-lg border border-[#D3D1C7] px-3 py-2 text-sm font-semibold text-[#2E86AB] transition hover:bg-[#EBF5FB] disabled:cursor-not-allowed disabled:opacity-50"
                title={canExportCycleCsv ? 'Export cycle data' : 'Business plan required'}
              >
                <Download size={14} />
                Export CSV
              </button>
            </div>

            <div className="mb-6 flex items-end gap-3 overflow-x-auto pb-2">
              {sortedCycles.map((cycle) => (
                <div key={cycle.id} className="flex min-w-24 flex-col items-center gap-2">
                  <div className="flex h-32 w-12 items-end rounded-lg bg-[#F1EFE8] p-1">
                    <div
                      className="w-full rounded-md bg-[#2E86AB]"
                      style={{ height: `${Math.max(4, (cycle.stats.resolutionRate / maxResolutionRate) * 100)}%` }}
                    />
                  </div>
                  <span className="text-center text-xs font-semibold text-[#1E3A5F]">{cycle.label}</span>
                  <span className="text-xs text-[#6B7B8D]">{Math.round(cycle.stats.resolutionRate)}%</span>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-[#6B7B8D]">
                  <tr className="border-b border-[#E8ECF0]">
                    <th className="py-2 pr-4">Cycle</th>
                    <th className="py-2 pr-4">Board</th>
                    <th className="py-2 pr-4">Submissions</th>
                    <th className="py-2 pr-4">Resolved</th>
                    <th className="py-2 pr-4">Resolution rate</th>
                    <th className="py-2 pr-4">Avg hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F4F8] text-[#444441]">
                  {sortedCycles.map((cycle) => (
                    <tr key={cycle.id}>
                      <td className="py-2 pr-4 font-semibold text-[#1E3A5F]">{cycle.label}</td>
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
        <div className="bg-white rounded-xl border border-[#E8ECF0] p-6 border-l-4 border-l-[#2E86AB]">
          <div className="flex items-start gap-3">
            <TrendingUp className="text-[#2E86AB] flex-shrink-0 mt-1" size={20} />
            <div>
              <h3 className="font-semibold text-[#1E3A5F] mb-1">About These Analytics</h3>
              <p className="text-[#6B7B8D] text-sm">
                This dashboard shows submission analytics and team performance metrics. Use the
                date range selector above to filter data by time period. Export reports in PDF
                format or download submission data as CSV for further analysis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
