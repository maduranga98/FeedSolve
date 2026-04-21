import { useState, useCallback, useMemo } from 'react';
import type { Submission, SearchFilters } from '../types';

export function useSearch(submissions: Submission[]) {
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});

  const clearSearch = useCallback(() => {
    setSearchText('');
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const clearAll = useCallback(() => {
    setSearchText('');
    setFilters({});
  }, []);

  const results = useMemo(() => {
    let filtered = submissions;

    // Full-text search
    if (searchText.trim()) {
      const query = searchText.toLowerCase();
      filtered = filtered.filter((submission) =>
        submission.subject.toLowerCase().includes(query) ||
        submission.description.toLowerCase().includes(query) ||
        submission.category.toLowerCase().includes(query) ||
        submission.trackingCode.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((sub) => filters.status!.includes(sub.status));
    }

    // Filter by priority
    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter((sub) => filters.priority!.includes(sub.priority));
    }

    // Filter by board
    if (filters.boardId && filters.boardId.length > 0) {
      filtered = filtered.filter((sub) => filters.boardId!.includes(sub.boardId));
    }

    // Filter by category
    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter((sub) => filters.category!.includes(sub.category));
    }

    // Filter by assignee
    if (filters.assignedTo) {
      filtered = filtered.filter((sub) => sub.assignedTo === filters.assignedTo);
    }

    // Filter by date range
    if (filters.dateRange) {
      const fromDate = filters.dateRange.from instanceof Date
        ? filters.dateRange.from
        : filters.dateRange.from.toDate();
      const toDate = filters.dateRange.to instanceof Date
        ? filters.dateRange.to
        : filters.dateRange.to.toDate();

      filtered = filtered.filter((sub) => {
        const createdDate = sub.createdAt.toDate();
        return createdDate >= fromDate && createdDate <= toDate;
      });
    }

    return filtered;
  }, [submissions, searchText, filters]);

  const hasActiveSearch = useMemo(
    () => searchText.trim().length > 0 || Object.keys(filters).length > 0,
    [searchText, filters]
  );

  return {
    searchText,
    setSearchText,
    filters,
    setFilters,
    results,
    hasActiveSearch,
    clearSearch,
    clearFilters,
    clearAll,
  };
}
