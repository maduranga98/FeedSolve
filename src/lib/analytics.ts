import type { Submission } from '../types';
import { Timestamp } from 'firebase/firestore';
import { isDateInRange, type DateRange } from './date-ranges';

export interface AnalyticsMetrics {
  totalSubmissions: number;
  resolvedSubmissions: number;
  resolutionRate: number;
  averageResolutionTime: number;
  submissionsByStatus: Record<string, number>;
  submissionsByPriority: Record<string, number>;
  submissionsByCategory: Record<string, number>;
  submissionsByBoard: Record<string, number>;
  teamPerformance: TeamPerformanceMetric[];
  trendData: TrendDataPoint[];
  submissionsBySource: Record<string, number>;
}

export interface TeamPerformanceMetric {
  userId: string;
  userName: string;
  userEmail: string;
  assignedCount: number;
  resolvedCount: number;
  resolutionRate: number;
  averageResolutionTime: number;
  averagePriority: string;
}

export interface TrendDataPoint {
  date: string;
  count: number;
  resolved: number;
}

function toDate(timestamp: Timestamp | undefined): Date | null {
  if (!timestamp) return null;
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp;
}

function calculateDaysDifference(startDate: Date | null, endDate: Date | null): number {
  if (!startDate || !endDate) return 0;
  return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

export function calculateAnalytics(
  submissions: Submission[],
  dateRange: DateRange
): AnalyticsMetrics {
  const filteredSubmissions = submissions.filter((sub) => {
    const createdDate = toDate(sub.createdAt);
    return createdDate && isDateInRange(createdDate, dateRange);
  });

  const totalSubmissions = filteredSubmissions.length;
  const resolvedSubmissions = filteredSubmissions.filter((s) => s.status === 'resolved').length;
  const resolutionRate = totalSubmissions > 0 ? (resolvedSubmissions / totalSubmissions) * 100 : 0;

  // Calculate average resolution time
  const resolvedWithTime = filteredSubmissions
    .filter((s) => s.status === 'resolved' && s.resolvedAt)
    .map((s) => {
      const created = toDate(s.createdAt);
      const resolved = toDate(s.resolvedAt);
      const days = calculateDaysDifference(created, resolved);
      return Math.max(0, days);
    });

  const averageResolutionTime =
    resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((a, b) => a + b, 0) / resolvedWithTime.length
      : 0;

  // Count submissions by status
  const submissionsByStatus: Record<string, number> = {};
  filteredSubmissions.forEach((s) => {
    submissionsByStatus[s.status] = (submissionsByStatus[s.status] || 0) + 1;
  });

  // Count submissions by priority
  const submissionsByPriority: Record<string, number> = {};
  filteredSubmissions.forEach((s) => {
    submissionsByPriority[s.priority] = (submissionsByPriority[s.priority] || 0) + 1;
  });

  // Count submissions by category
  const submissionsByCategory: Record<string, number> = {};
  filteredSubmissions.forEach((s) => {
    submissionsByCategory[s.category] = (submissionsByCategory[s.category] || 0) + 1;
  });

  // Count submissions by board
  const submissionsByBoard: Record<string, number> = {};
  filteredSubmissions.forEach((s) => {
    submissionsByBoard[s.boardId] = (submissionsByBoard[s.boardId] || 0) + 1;
  });

  // Count submissions by source (board/QR)
  const submissionsBySource = submissionsByBoard;

  // Calculate team performance
  const teamPerformance = calculateTeamPerformance(filteredSubmissions);

  // Generate trend data
  const trendData = generateTrendData(filteredSubmissions);

  return {
    totalSubmissions,
    resolvedSubmissions,
    resolutionRate,
    averageResolutionTime,
    submissionsByStatus,
    submissionsByPriority,
    submissionsByCategory,
    submissionsByBoard,
    teamPerformance,
    trendData,
    submissionsBySource,
  };
}

function calculateTeamPerformance(submissions: Submission[]): TeamPerformanceMetric[] {
  const teamMap = new Map<string, any>();

  submissions.forEach((sub) => {
    const userId = sub.assignedTo || 'unassigned';
    if (!teamMap.has(userId)) {
      teamMap.set(userId, {
        userId,
        userName: 'Unknown',
        userEmail: '',
        assignedCount: 0,
        resolvedCount: 0,
        resolutionTimes: [] as number[],
        priorities: [] as string[],
      });
    }

    const member = teamMap.get(userId);
    member.assignedCount += 1;

    if (sub.status === 'resolved') {
      member.resolvedCount += 1;
      const created = toDate(sub.createdAt);
      const resolved = toDate(sub.resolvedAt);
      const days = calculateDaysDifference(created, resolved);
      member.resolutionTimes.push(Math.max(0, days));
    }

    member.priorities.push(sub.priority);
  });

  return Array.from(teamMap.values())
    .filter((m) => m.userId !== 'unassigned')
    .map((m) => {
      const avgResolutionTime =
        m.resolutionTimes.length > 0
          ? m.resolutionTimes.reduce((a: number, b: number) => a + b, 0) / m.resolutionTimes.length
          : 0;

      const priorityValues = { critical: 4, high: 3, medium: 2, low: 1 };
      const avgPriorityScore =
        m.priorities.length > 0
          ? m.priorities.reduce((sum: number, p: string) => sum + (priorityValues[p as keyof typeof priorityValues] || 0), 0) /
            m.priorities.length
          : 0;

      const priorityMap = { 4: 'critical', 3: 'high', 2: 'medium', 1: 'low', 0: 'low' };
      const averagePriority =
        priorityMap[Math.round(avgPriorityScore) as keyof typeof priorityMap] || 'low';

      const resolutionRate =
        m.assignedCount > 0 ? (m.resolvedCount / m.assignedCount) * 100 : 0;

      return {
        userId: m.userId,
        userName: m.userName,
        userEmail: m.userEmail,
        assignedCount: m.assignedCount,
        resolvedCount: m.resolvedCount,
        resolutionRate,
        averageResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        averagePriority,
      };
    })
    .sort((a, b) => b.assignedCount - a.assignedCount);
}

function generateTrendData(submissions: Submission[]): TrendDataPoint[] {
  const trendMap = new Map<string, { count: number; resolved: number }>();

  submissions.forEach((sub) => {
    const createdDate = toDate(sub.createdAt);
    if (!createdDate) return;

    const dateKey = createdDate.toISOString().split('T')[0];
    if (!trendMap.has(dateKey)) {
      trendMap.set(dateKey, { count: 0, resolved: 0 });
    }

    const trend = trendMap.get(dateKey)!;
    trend.count += 1;
    if (sub.status === 'resolved') {
      trend.resolved += 1;
    }
  });

  return Array.from(trendMap.entries())
    .map(([date, data]) => ({
      date,
      count: data.count,
      resolved: data.resolved,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    received: '#3b82f6',
    in_review: '#f59e0b',
    in_progress: '#8b5cf6',
    resolved: '#10b981',
    closed: '#6b7280',
  };
  return colors[status] || '#9ca3af';
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#10b981',
  };
  return colors[priority] || '#9ca3af';
}
