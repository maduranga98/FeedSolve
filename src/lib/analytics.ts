import type { Submission, Board } from '../types';
import { Timestamp } from 'firebase/firestore';
import { isDateInRange, type DateRange } from './date-ranges';

// ─── Core Interfaces ─────────────────────────────────────────────────────────

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

// ─── Advanced Interfaces ──────────────────────────────────────────────────────

export interface SLAMetric {
  priority: string;
  targetDays: number;
  totalResolved: number;
  met: number;
  breached: number;
  complianceRate: number;
  avgResolutionDays: number;
}

export interface HeatmapDataPoint {
  day: number;   // 0=Mon … 6=Sun
  hour: number;  // 0-23
  count: number;
}

export interface AnomalyDataPoint extends TrendDataPoint {
  rollingAvg: number;
  stdDev: number;
  isAnomaly: boolean;
}

export interface CohortRow {
  cohortLabel: string;
  cohortStart: string;
  total: number;
  resolvedByPeriod: number[];  // % resolved by end of each week (index 0 = week 1, …)
  periods: number;
}

export interface BoardComparisonData {
  boardId: string;
  boardName: string;
  totalSubmissions: number;
  resolvedSubmissions: number;
  resolutionRate: number;
  avgResolutionDays: number;
  openCount: number;
}

export interface ForecastDataPoint {
  date: string;
  actual: number | null;
  forecast: number | null;
}

export interface FunnelStage {
  status: string;
  label: string;
  count: number;
  percentage: number;
  avgDaysInStage: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDate(timestamp: Timestamp | undefined): Date | null {
  if (!timestamp) return null;
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  return timestamp as unknown as Date;
}

function daysDiff(a: Date | null, b: Date | null): number {
  if (!a || !b) return 0;
  return Math.max(0, (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Core Analytics ───────────────────────────────────────────────────────────

export function calculateAnalytics(
  submissions: Submission[],
  dateRange: DateRange
): AnalyticsMetrics {
  const filtered = submissions.filter((sub) => {
    const d = toDate(sub.createdAt);
    return d && isDateInRange(d, dateRange);
  });

  const total = filtered.length;
  const resolved = filtered.filter((s) => s.status === 'resolved').length;
  const resolutionRate = total > 0 ? (resolved / total) * 100 : 0;

  const resolvedTimes = filtered
    .filter((s) => s.status === 'resolved' && s.resolvedAt)
    .map((s) => daysDiff(toDate(s.createdAt), toDate(s.resolvedAt)));

  const averageResolutionTime =
    resolvedTimes.length > 0
      ? resolvedTimes.reduce((a, b) => a + b, 0) / resolvedTimes.length
      : 0;

  const submissionsByStatus: Record<string, number> = {};
  const submissionsByPriority: Record<string, number> = {};
  const submissionsByCategory: Record<string, number> = {};
  const submissionsByBoard: Record<string, number> = {};

  filtered.forEach((s) => {
    submissionsByStatus[s.status] = (submissionsByStatus[s.status] || 0) + 1;
    submissionsByPriority[s.priority] = (submissionsByPriority[s.priority] || 0) + 1;
    submissionsByCategory[s.category] = (submissionsByCategory[s.category] || 0) + 1;
    submissionsByBoard[s.boardId] = (submissionsByBoard[s.boardId] || 0) + 1;
  });

  return {
    totalSubmissions: total,
    resolvedSubmissions: resolved,
    resolutionRate,
    averageResolutionTime,
    submissionsByStatus,
    submissionsByPriority,
    submissionsByCategory,
    submissionsByBoard,
    teamPerformance: calculateTeamPerformance(filtered),
    trendData: generateTrendData(filtered),
    submissionsBySource: submissionsByBoard,
  };
}

function calculateTeamPerformance(submissions: Submission[]): TeamPerformanceMetric[] {
  const map = new Map<string, any>();

  submissions.forEach((sub) => {
    const userId = sub.assignedTo || 'unassigned';
    if (!map.has(userId)) {
      map.set(userId, {
        userId,
        userName: 'Unknown',
        userEmail: '',
        assignedCount: 0,
        resolvedCount: 0,
        resolutionTimes: [] as number[],
        priorities: [] as string[],
      });
    }
    const m = map.get(userId);
    m.assignedCount += 1;
    if (sub.status === 'resolved') {
      m.resolvedCount += 1;
      m.resolutionTimes.push(daysDiff(toDate(sub.createdAt), toDate(sub.resolvedAt)));
    }
    m.priorities.push(sub.priority);
  });

  return Array.from(map.values())
    .filter((m) => m.userId !== 'unassigned')
    .map((m) => {
      const avgResolutionTime =
        m.resolutionTimes.length > 0
          ? m.resolutionTimes.reduce((a: number, b: number) => a + b, 0) / m.resolutionTimes.length
          : 0;

      const priorityValues = { critical: 4, high: 3, medium: 2, low: 1 };
      const avgPriorityScore =
        m.priorities.length > 0
          ? m.priorities.reduce(
              (sum: number, p: string) =>
                sum + (priorityValues[p as keyof typeof priorityValues] || 0),
              0
            ) / m.priorities.length
          : 0;

      const priorityMap: Record<number, string> = { 4: 'critical', 3: 'high', 2: 'medium', 1: 'low', 0: 'low' };

      return {
        userId: m.userId,
        userName: m.userName,
        userEmail: m.userEmail,
        assignedCount: m.assignedCount,
        resolvedCount: m.resolvedCount,
        resolutionRate: m.assignedCount > 0 ? (m.resolvedCount / m.assignedCount) * 100 : 0,
        averageResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        averagePriority: priorityMap[Math.round(avgPriorityScore)] || 'low',
      };
    })
    .sort((a, b) => b.assignedCount - a.assignedCount);
}

function generateTrendData(submissions: Submission[]): TrendDataPoint[] {
  const map = new Map<string, { count: number; resolved: number }>();

  submissions.forEach((sub) => {
    const d = toDate(sub.createdAt);
    if (!d) return;
    const key = d.toISOString().split('T')[0];
    if (!map.has(key)) map.set(key, { count: 0, resolved: 0 });
    const entry = map.get(key)!;
    entry.count += 1;
    if (sub.status === 'resolved') entry.resolved += 1;
  });

  return Array.from(map.entries())
    .map(([date, data]) => ({ date, count: data.count, resolved: data.resolved }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ─── SLA Tracking ─────────────────────────────────────────────────────────────

const SLA_TARGETS: Record<string, number> = {
  critical: 1,
  high: 3,
  medium: 7,
  low: 14,
};

export function calculateSLAMetrics(submissions: Submission[]): SLAMetric[] {
  return ['critical', 'high', 'medium', 'low'].map((priority) => {
    const target = SLA_TARGETS[priority];
    const resolved = submissions.filter(
      (s) => s.priority === priority && s.status === 'resolved' && s.resolvedAt
    );

    let totalDays = 0;
    let met = 0;

    resolved.forEach((s) => {
      const days = daysDiff(toDate(s.createdAt), toDate(s.resolvedAt));
      totalDays += days;
      if (days <= target) met += 1;
    });

    const total = resolved.length;
    return {
      priority,
      targetDays: target,
      totalResolved: total,
      met,
      breached: total - met,
      complianceRate: total > 0 ? (met / total) * 100 : 100,
      avgResolutionDays: total > 0 ? Math.round((totalDays / total) * 10) / 10 : 0,
    };
  });
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────

export function calculateHeatmapData(submissions: Submission[]): HeatmapDataPoint[] {
  const grid: Record<string, number> = {};

  submissions.forEach((sub) => {
    const d = toDate(sub.createdAt);
    if (!d) return;
    const day = (d.getDay() + 6) % 7; // Mon=0, Sun=6
    const hour = d.getHours();
    const key = `${day}-${hour}`;
    grid[key] = (grid[key] || 0) + 1;
  });

  const result: HeatmapDataPoint[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      result.push({ day, hour, count: grid[`${day}-${hour}`] || 0 });
    }
  }
  return result;
}

// ─── Anomaly Detection ────────────────────────────────────────────────────────

export function calculateAnomalyData(
  trendData: TrendDataPoint[],
  windowSize = 7,
  threshold = 1.5
): AnomalyDataPoint[] {
  if (trendData.length < windowSize) {
    return trendData.map((p) => ({ ...p, rollingAvg: p.count, stdDev: 0, isAnomaly: false }));
  }

  return trendData.map((point, i) => {
    const start = Math.max(0, i - windowSize);
    const window = trendData.slice(start, i);
    const counts = window.map((p) => p.count);

    const avg = counts.length > 0 ? counts.reduce((a, b) => a + b, 0) / counts.length : point.count;
    const variance =
      counts.length > 1
        ? counts.reduce((sum, v) => sum + (v - avg) ** 2, 0) / counts.length
        : 0;
    const stdDev = Math.sqrt(variance);

    const isAnomaly = stdDev > 0 && Math.abs(point.count - avg) > threshold * stdDev;

    return {
      ...point,
      rollingAvg: Math.round(avg * 10) / 10,
      stdDev: Math.round(stdDev * 10) / 10,
      isAnomaly,
    };
  });
}

// ─── Cohort Analysis ──────────────────────────────────────────────────────────

export function calculateCohortData(submissions: Submission[], periodsToTrack = 4): CohortRow[] {
  // Group submissions by ISO week (Monday-based)
  const getWeekKey = (date: Date): string => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // back to Monday
    return d.toISOString().split('T')[0];
  };

  const cohorts = new Map<string, Submission[]>();

  submissions.forEach((sub) => {
    const d = toDate(sub.createdAt);
    if (!d) return;
    const key = getWeekKey(d);
    if (!cohorts.has(key)) cohorts.set(key, []);
    cohorts.get(key)!.push(sub);
  });

  const now = new Date();

  return Array.from(cohorts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8) // last 8 cohort weeks
    .map(([weekStart, subs]) => {
      const cohortDate = new Date(weekStart);
      const weeksElapsed = Math.floor(
        (now.getTime() - cohortDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
      );
      const periodsAvailable = Math.min(periodsToTrack, weeksElapsed + 1);

      const resolvedByPeriod: number[] = [];

      for (let week = 1; week <= periodsToTrack; week++) {
        const cutoff = new Date(cohortDate.getTime() + week * 7 * 24 * 60 * 60 * 1000);
        if (cutoff > now) {
          resolvedByPeriod.push(-1); // not yet reached
          continue;
        }
        const resolvedByThen = subs.filter((s) => {
          const r = toDate(s.resolvedAt);
          return s.status === 'resolved' && r && r <= cutoff;
        }).length;
        resolvedByPeriod.push(subs.length > 0 ? Math.round((resolvedByThen / subs.length) * 100) : 0);
      }

      const label = cohortDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return {
        cohortLabel: `Week of ${label}`,
        cohortStart: weekStart,
        total: subs.length,
        resolvedByPeriod,
        periods: periodsAvailable,
      };
    });
}

// ─── Board Comparison ─────────────────────────────────────────────────────────

export function calculateBoardComparison(
  submissions: Submission[],
  boards: Board[]
): BoardComparisonData[] {
  const boardMap = new Map(boards.map((b) => [b.id, b.name]));

  const grouped = new Map<string, Submission[]>();
  submissions.forEach((s) => {
    if (!grouped.has(s.boardId)) grouped.set(s.boardId, []);
    grouped.get(s.boardId)!.push(s);
  });

  return Array.from(grouped.entries())
    .map(([boardId, subs]) => {
      const resolved = subs.filter((s) => s.status === 'resolved');
      const open = subs.filter((s) => ['received', 'in_review', 'in_progress'].includes(s.status));

      const totalDays = resolved.reduce(
        (sum, s) => sum + daysDiff(toDate(s.createdAt), toDate(s.resolvedAt)),
        0
      );

      return {
        boardId,
        boardName: boardMap.get(boardId) || boardId,
        totalSubmissions: subs.length,
        resolvedSubmissions: resolved.length,
        resolutionRate: subs.length > 0 ? (resolved.length / subs.length) * 100 : 0,
        avgResolutionDays:
          resolved.length > 0 ? Math.round((totalDays / resolved.length) * 10) / 10 : 0,
        openCount: open.length,
      };
    })
    .sort((a, b) => b.totalSubmissions - a.totalSubmissions);
}

// ─── Forecast ────────────────────────────────────────────────────────────────

export function calculateForecastData(
  trendData: TrendDataPoint[],
  daysAhead = 14
): ForecastDataPoint[] {
  if (trendData.length < 3) {
    return trendData.map((p) => ({ date: p.date, actual: p.count, forecast: null }));
  }

  // Simple linear regression on last 30 data points
  const recent = trendData.slice(-30);
  const n = recent.length;
  const xs = recent.map((_, i) => i);
  const ys = recent.map((p) => p.count);

  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((sum, x, i) => sum + x * ys[i], 0);
  const sumX2 = xs.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const actual: ForecastDataPoint[] = trendData.map((p) => ({
    date: p.date,
    actual: p.count,
    forecast: null,
  }));

  const lastDate = new Date(trendData[trendData.length - 1].date);
  const forecasted: ForecastDataPoint[] = [];

  for (let i = 1; i <= daysAhead; i++) {
    const d = new Date(lastDate);
    d.setDate(d.getDate() + i);
    const x = n - 1 + i;
    const value = Math.max(0, Math.round(slope * x + intercept));
    forecasted.push({
      date: d.toISOString().split('T')[0],
      actual: null,
      forecast: value,
    });
  }

  return [...actual, ...forecasted];
}

// ─── Funnel Analysis ─────────────────────────────────────────────────────────

const STATUS_ORDER = ['received', 'in_review', 'in_progress', 'resolved', 'closed'];
const STATUS_LABELS: Record<string, string> = {
  received: 'Received',
  in_review: 'In Review',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export function calculateFunnelData(submissions: Submission[]): FunnelStage[] {
  const total = submissions.length;
  if (total === 0) {
    return STATUS_ORDER.map((status) => ({
      status,
      label: STATUS_LABELS[status],
      count: 0,
      percentage: 0,
      avgDaysInStage: null,
    }));
  }

  // Count submissions that have reached each stage (cumulative funnel)
  const stageCounts: Record<string, number> = {};
  STATUS_ORDER.forEach((status) => {
    stageCounts[status] = 0;
  });
  submissions.forEach((s) => {
    const idx = STATUS_ORDER.indexOf(s.status);
    for (let i = 0; i <= idx; i++) {
      stageCounts[STATUS_ORDER[i]] = (stageCounts[STATUS_ORDER[i]] || 0) + 1;
    }
  });

  // Avg days in each terminal/current stage
  const stageTimings: Record<string, number[]> = {};
  submissions.forEach((s) => {
    const created = toDate(s.createdAt);
    const updated = toDate(s.updatedAt);
    if (!created || !updated) return;
    const elapsed = daysDiff(created, updated);
    if (!stageTimings[s.status]) stageTimings[s.status] = [];
    stageTimings[s.status].push(elapsed);
  });

  return STATUS_ORDER.map((status) => {
    const count = stageCounts[status] || 0;
    const times = stageTimings[status];
    const avgDaysInStage =
      times && times.length > 0
        ? Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10
        : null;

    return {
      status,
      label: STATUS_LABELS[status],
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
      avgDaysInStage,
    };
  });
}

// ─── Color Helpers ────────────────────────────────────────────────────────────

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
