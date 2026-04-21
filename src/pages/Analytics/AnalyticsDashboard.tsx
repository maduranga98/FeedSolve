import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/Shared';
import { getCompanySubmissions, getCompanyBoards } from '../../lib/firestore';
import type { Submission, Board } from '../../types';

interface StatCard {
  label: string;
  value: string | number;
  subtext?: string;
  color: 'primary' | 'accent' | 'success' | 'warning' | 'error';
}

const colorMap = {
  primary: 'bg-blue-50 border-blue-200 text-blue-900',
  accent: 'bg-cyan-50 border-cyan-200 text-cyan-900',
  success: 'bg-green-50 border-green-200 text-green-900',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  error: 'bg-red-50 border-red-200 text-red-900',
};

export function AnalyticsDashboard() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Calculate statistics
  const totalSubmissions = submissions.length;
  const totalBoards = boards.length;
  const avgSubmissionsPerBoard =
    totalBoards > 0 ? (totalSubmissions / totalBoards).toFixed(1) : 0;

  const statusCounts = submissions.reduce(
    (acc, sub) => {
      acc[sub.status] = (acc[sub.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const priorityCounts = submissions.reduce(
    (acc, sub) => {
      acc[sub.priority] = (acc[sub.priority] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const resolvedCount = statusCounts.resolved || 0;
  const resolutionRate =
    totalSubmissions > 0 ? ((resolvedCount / totalSubmissions) * 100).toFixed(1) : 0;

  const receivedCount = statusCounts.received || 0;
  const inReviewCount = statusCounts.in_review || 0;
  const inProgressCount = statusCounts.in_progress || 0;

  const criticalCount = priorityCounts.critical || 0;

  const statCards: StatCard[] = [
    {
      label: 'Total Submissions',
      value: totalSubmissions,
      color: 'primary',
    },
    {
      label: 'Total Boards',
      value: totalBoards,
      color: 'accent',
    },
    {
      label: 'Avg Submissions/Board',
      value: avgSubmissionsPerBoard,
      color: 'accent',
    },
    {
      label: 'Resolution Rate',
      value: `${resolutionRate}%`,
      color: 'success',
    },
    {
      label: 'Resolved',
      value: resolvedCount,
      subtext: 'submissions',
      color: 'success',
    },
    {
      label: 'Pending Review',
      value: receivedCount + inReviewCount,
      subtext: 'submissions',
      color: 'warning',
    },
    {
      label: 'In Progress',
      value: inProgressCount,
      subtext: 'submissions',
      color: 'warning',
    },
    {
      label: 'Critical Priority',
      value: criticalCount,
      subtext: 'submissions',
      color: 'error',
    },
  ];

  const allStatuses = ['received', 'in_review', 'in_progress', 'resolved', 'closed'];
  const statusData = allStatuses.map((status) => ({
    status,
    count: statusCounts[status] || 0,
    percentage:
      totalSubmissions > 0
        ? (((statusCounts[status] || 0) / totalSubmissions) * 100).toFixed(1)
        : 0,
  }));

  const allPriorities = ['low', 'medium', 'high', 'critical'];
  const priorityData = allPriorities.map((priority) => ({
    priority,
    count: priorityCounts[priority] || 0,
    percentage:
      totalSubmissions > 0
        ? (((priorityCounts[priority] || 0) / totalSubmissions) * 100).toFixed(1)
        : 0,
  }));

  const categoryData = submissions.reduce(
    (acc, sub) => {
      const existing = acc.find((c) => c.category === sub.category);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ category: sub.category, count: 1 });
      }
      return acc;
    },
    [] as Array<{ category: string; count: number }>
  );

  categoryData.sort((a, b) => b.count - a.count);

  return (
    <main className="min-h-screen bg-color-bg">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-color-primary mb-8">Analytics & Reports</h1>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card, idx) => (
            <div
              key={idx}
              className={`${colorMap[card.color]} border rounded-lg p-6`}
            >
              <p className="text-sm font-medium opacity-75 mb-2">{card.label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">{card.value}</p>
                {card.subtext && <p className="text-xs opacity-60">{card.subtext}</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Status Breakdown */}
          <div className="bg-color-surface rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-color-primary mb-4">
              Status Breakdown
            </h2>
            <div className="space-y-3">
              {statusData.map((item) => (
                <div key={item.status}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-color-body-text capitalize">
                      {item.status.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-color-muted-text">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-color-border rounded-full h-2">
                    <div
                      className="bg-color-accent h-2 rounded-full transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Breakdown */}
          <div className="bg-color-surface rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-color-primary mb-4">
              Priority Breakdown
            </h2>
            <div className="space-y-3">
              {priorityData.map((item) => {
                let bgColor = 'bg-gray-300';
                if (item.priority === 'critical') bgColor = 'bg-red-500';
                else if (item.priority === 'high') bgColor = 'bg-orange-500';
                else if (item.priority === 'medium') bgColor = 'bg-yellow-500';
                else if (item.priority === 'low') bgColor = 'bg-green-500';

                return (
                  <div key={item.priority}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-color-body-text capitalize">
                        {item.priority}
                      </span>
                      <span className="text-sm text-color-muted-text">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-color-border rounded-full h-2">
                      <div
                        className={`${bgColor} h-2 rounded-full transition-all`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Categories */}
          <div className="bg-color-surface rounded-lg shadow-md p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-color-primary mb-4">
              Submissions by Category
            </h2>
            {categoryData.length === 0 ? (
              <p className="text-color-muted-text">No submissions yet.</p>
            ) : (
              <div className="space-y-3">
                {categoryData.map((item) => {
                  const percentage =
                    totalSubmissions > 0 ? ((item.count / totalSubmissions) * 100).toFixed(1) : 0;
                  return (
                    <div key={item.category}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-color-body-text">
                          {item.category}
                        </span>
                        <span className="text-sm text-color-muted-text">
                          {item.count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-color-border rounded-full h-2">
                        <div
                          className="bg-color-primary h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
