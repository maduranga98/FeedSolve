import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import type { SearchFilters, Submission } from '../types';

export function useURLFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<SearchFilters>(() => {
    const filters: SearchFilters = {};

    const status = searchParams.getAll('status');
    if (status.length > 0) {
      filters.status = status as Submission['status'][];
    }

    const priority = searchParams.getAll('priority');
    if (priority.length > 0) {
      filters.priority = priority as Submission['priority'][];
    }

    const boardId = searchParams.getAll('board');
    if (boardId.length > 0) {
      filters.boardId = boardId;
    }

    const category = searchParams.getAll('category');
    if (category.length > 0) {
      filters.category = category;
    }

    const assignedTo = searchParams.get('assignedTo');
    if (assignedTo) {
      filters.assignedTo = assignedTo;
    }

    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    if (fromDate && toDate) {
      filters.dateRange = {
        from: new Date(fromDate),
        to: new Date(toDate),
      };
    }

    return filters;
  }, [searchParams]);

  const updateFilters = useCallback(
    (newFilters: SearchFilters) => {
      const params = new URLSearchParams();

      if (newFilters.status && newFilters.status.length > 0) {
        newFilters.status.forEach((s) => params.append('status', s));
      }

      if (newFilters.priority && newFilters.priority.length > 0) {
        newFilters.priority.forEach((p) => params.append('priority', p));
      }

      if (newFilters.boardId && newFilters.boardId.length > 0) {
        newFilters.boardId.forEach((b) => params.append('board', b));
      }

      if (newFilters.category && newFilters.category.length > 0) {
        newFilters.category.forEach((c) => params.append('category', c));
      }

      if (newFilters.assignedTo) {
        params.append('assignedTo', newFilters.assignedTo);
      }

      if (newFilters.dateRange) {
        const from = newFilters.dateRange.from instanceof Date
          ? newFilters.dateRange.from.toISOString()
          : newFilters.dateRange.from.toDate().toISOString();
        const to = newFilters.dateRange.to instanceof Date
          ? newFilters.dateRange.to.toISOString()
          : newFilters.dateRange.to.toDate().toISOString();

        params.append('fromDate', from);
        params.append('toDate', to);
      }

      setSearchParams(params);
    },
    [setSearchParams]
  );

  const clearFilters = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  const getShareURL = useCallback(() => {
    return `${window.location.pathname}?${searchParams.toString()}`;
  }, [searchParams]);

  return {
    filters,
    updateFilters,
    clearFilters,
    getShareURL,
  };
}
