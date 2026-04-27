import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/Shared';
import { getCompanySubmissions, getCompanyBoards } from '../../lib/firestore';
import { MetricCard } from '../../components/Analytics/MetricCard';
import { TrendChart } from '../../components/Analytics/TrendChart';
import { PerformanceTable } from '../../components/Analytics/PerformanceTable';
import { StatusChart } from '../../components/Analytics/StatusChart';
import { PriorityChart } from '../../components/Analytics/PriorityChart';
import { CategoryChart } from '../../components/Analytics/CategoryChart';
import { SourceChart } from '../../components/Analytics/SourceChart';
import { ReportBuilder, type ReportOptions } from '../../components/Analytics/ReportBuilder';
import { calculateAnalytics } from '../../lib/analytics';
import { downloadPDFReport, downloadCSV } from '../../lib/export-report';
import { getDateRangePreset, type DateRange } from '../../lib/date-ranges';
import type { Submission, Board } from '../../types';

export function AnalyticsDashboard() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangePreset('30days'));
  const [exportLoading, setExportLoading] = useState(false);

  if (!user) return null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [submissionsData, boardsData] = await Promise.all([
          getCompanySubmissions(user.companyId),
          getCompanyBoards(user.companyId),
        ]);
        setSubmissions(submissionsData);
        setBoards(boardsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const metrics = calculateAnalytics(submissions, dateRange);
  const boardMap = boards.reduce((acc, b) => {
    acc[b.id] = b.name;
    return acc;
  }, {} as Record<string, string>);

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

  return (
    <main className="min-h-screen bg-[#F4F7FA]">
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
          <ReportBuilder
            onGenerateReport={handleGenerateReport}
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
            loading={exportLoading}
          />
        </div>

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
