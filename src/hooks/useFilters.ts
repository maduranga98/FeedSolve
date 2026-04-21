import { useState, useCallback, useMemo } from 'react';
import type { Submission } from '../types';

export interface SubmissionFilters {
  status: Submission['status'][];
  board: string[];
  assignee: string[];
  priority: Submission['priority'][];
  dateRange: {
    start?: Date;
    end?: Date;
  };
}

const defaultFilters: SubmissionFilters = {
  status: [],
  board: [],
  assignee: [],
  priority: [],
  dateRange: {},
};

export function useFilters(submissions: Submission[]) {
  const [filters, setFilters] = useState<SubmissionFilters>(defaultFilters);

  const setStatusFilter = useCallback((statuses: Submission['status'][]) => {
    setFilters((prev) => ({ ...prev, status: statuses }));
  }, []);

  const setBoardFilter = useCallback((boards: string[]) => {
    setFilters((prev) => ({ ...prev, board: boards }));
  }, []);

  const setAssigneeFilter = useCallback((assignees: string[]) => {
    setFilters((prev) => ({ ...prev, assignee: assignees }));
  }, []);

  const setPriorityFilter = useCallback((priorities: Submission['priority'][]) => {
    setFilters((prev) => ({ ...prev, priority: priorities }));
  }, []);

  const setDateRange = useCallback((start?: Date, end?: Date) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: { start, end },
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const hasActiveFilters = useMemo(
    () =>
      filters.status.length > 0 ||
      filters.board.length > 0 ||
      filters.assignee.length > 0 ||
      filters.priority.length > 0 ||
      filters.dateRange.start ||
      filters.dateRange.end,
    [filters]
  );

  const filtered = useMemo(() => {
    return submissions.filter((submission) => {
      if (
        filters.status.length > 0 &&
        !filters.status.includes(submission.status)
      ) {
        return false;
      }

      if (filters.board.length > 0 && !filters.board.includes(submission.boardId)) {
        return false;
      }

      if (
        filters.assignee.length > 0 &&
        (!submission.assignedTo || !filters.assignee.includes(submission.assignedTo))
      ) {
        return false;
      }

      if (
        filters.priority.length > 0 &&
        !filters.priority.includes(submission.priority)
      ) {
        return false;
      }

      if (filters.dateRange.start) {
        const submissionDate = submission.createdAt.toDate();
        if (submissionDate < filters.dateRange.start) {
          return false;
        }
      }

      if (filters.dateRange.end) {
        const submissionDate = submission.createdAt.toDate();
        const endOfDay = new Date(filters.dateRange.end);
        endOfDay.setHours(23, 59, 59, 999);
        if (submissionDate > endOfDay) {
          return false;
        }
      }

      return true;
    });
  }, [submissions, filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status.length > 0) count += filters.status.length;
    if (filters.board.length > 0) count += filters.board.length;
    if (filters.assignee.length > 0) count += filters.assignee.length;
    if (filters.priority.length > 0) count += filters.priority.length;
    if (filters.dateRange.start) count += 1;
    if (filters.dateRange.end) count += 1;
    return count;
  }, [filters]);

  return {
    filters,
    filtered,
    hasActiveFilters,
    activeFilterCount,
    setStatusFilter,
    setBoardFilter,
    setAssigneeFilter,
    setPriorityFilter,
    setDateRange,
    clearAllFilters,
  };
}
