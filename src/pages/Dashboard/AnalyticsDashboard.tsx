import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getCompanyStats, type CompanyStats } from '../../lib/firestore';
import { LoadingSpinner } from '../../components/Shared';
import StatCard from '../../components/Analytics/StatCard';
import ResolutionRateCard from '../../components/Analytics/ResolutionRateCard';
import SubmissionsByBoardChart from '../../components/Analytics/SubmissionsByBoardChart';
import SubmissionsByPriorityChart from '../../components/Analytics/SubmissionsByPriorityChart';
import {
  TrendingUp,
  CheckCircle,
  Clock,
  ClipboardList,
  XCircle,
} from 'lucide-react';

export function AnalyticsDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;

      try {
        const data = await getCompanyStats(user.companyId);
        setStats(data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user]);

  if (loading || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <LoadingSpinner size="lg" className="min-h-96" />
      </div>
    );
  }

  const resolvedTotal = stats.resolvedCount + stats.closedCount;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1E3A5F] mb-2">Analytics</h1>
        <p className="text-[#6B7B8D]">Feedback resolution metrics and trends</p>
      </div>

      {/* Resolution Rate Card */}
      <div className="mb-8">
        <ResolutionRateCard
          rate={stats.resolutionRate}
          resolved={resolvedTotal}
          total={stats.totalSubmissions}
        />
      </div>

      {/* Status Stats */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[#1E3A5F] mb-4">Status Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Received"
            value={stats.receivedCount}
            color="gray"
            icon={<ClipboardList size={20} />}
          />
          <StatCard
            label="In Review"
            value={stats.inReviewCount}
            color="blue"
            icon={<Clock size={20} />}
          />
          <StatCard
            label="In Progress"
            value={stats.inProgressCount}
            color="yellow"
            icon={<TrendingUp size={20} />}
          />
          <StatCard
            label="Resolved"
            value={stats.resolvedCount}
            color="green"
            icon={<CheckCircle size={20} />}
          />
          <StatCard
            label="Closed"
            value={stats.closedCount}
            color="gray"
            icon={<XCircle size={20} />}
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[#1E3A5F] mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            label="Total Submissions"
            value={stats.totalSubmissions}
            color="teal"
          />
          <StatCard
            label="Avg Resolution Time"
            value={`${stats.avgResolutionDays.toFixed(1)} days`}
            color="teal"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* By Board */}
        <div className="bg-white rounded-lg border border-[#D3D1C7] p-6">
          <h3 className="text-lg font-semibold text-[#1E3A5F] mb-4">
            Submissions by Board
          </h3>
          <SubmissionsByBoardChart data={stats.submissionsByBoard} />
        </div>

        {/* By Priority */}
        <div className="bg-white rounded-lg border border-[#D3D1C7] p-6">
          <h3 className="text-lg font-semibold text-[#1E3A5F] mb-4">
            Submissions by Priority
          </h3>
          <SubmissionsByPriorityChart data={stats.submissionsByPriority} />
        </div>

        {/* By Category */}
        <div className="bg-white rounded-lg border border-[#D3D1C7] p-6">
          <h3 className="text-lg font-semibold text-[#1E3A5F] mb-4">
            Submissions by Category
          </h3>
          <div className="space-y-2">
            {Object.entries(stats.submissionsByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => (
                <div
                  key={category}
                  className="flex items-center justify-between p-2 bg-[#F8FAFB] rounded"
                >
                  <span className="text-sm text-[#444441]">{category}</span>
                  <span className="text-sm font-medium text-[#1E3A5F]">{count}</span>
                </div>
              ))}
            {Object.keys(stats.submissionsByCategory).length === 0 && (
              <p className="text-[#6B7B8D] text-sm">No data available</p>
            )}
          </div>
        </div>

        {/* By Assignee */}
        <div className="bg-white rounded-lg border border-[#D3D1C7] p-6">
          <h3 className="text-lg font-semibold text-[#1E3A5F] mb-4">
            Workload by Team Member
          </h3>
          <div className="space-y-2">
            {Object.values(stats.submissionsByAssignee)
              .sort((a, b) => b.count - a.count)
              .map((assignee) => (
                <div
                  key={assignee.name}
                  className="flex items-center justify-between p-2 bg-[#F8FAFB] rounded"
                >
                  <span className="text-sm text-[#444441]">{assignee.name}</span>
                  <span className="text-sm font-medium text-[#1E3A5F]">
                    {assignee.count}
                  </span>
                </div>
              ))}
            {Object.keys(stats.submissionsByAssignee).length === 0 && (
              <p className="text-[#6B7B8D] text-sm">No assignments yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
