import { useState, useCallback } from 'react';
import { BulkOperation } from '../types';

interface BulkOperationState {
  selectedIds: Set<string>;
  isLoading: boolean;
  currentOperation: BulkOperation | null;
  error: string | null;
}

export function useBulkOperations() {
  const [state, setState] = useState<BulkOperationState>({
    selectedIds: new Set(),
    isLoading: false,
    currentOperation: null,
    error: null,
  });

  const toggleSelection = useCallback((submissionId: string) => {
    setState((prev) => {
      const newSelected = new Set(prev.selectedIds);
      if (newSelected.has(submissionId)) {
        newSelected.delete(submissionId);
      } else {
        newSelected.add(submissionId);
      }
      return { ...prev, selectedIds: newSelected };
    });
  }, []);

  const selectAll = useCallback((submissionIds: string[]) => {
    setState((prev) => ({
      ...prev,
      selectedIds: new Set(submissionIds),
    }));
  }, []);

  const deselectAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedIds: new Set(),
    }));
  }, []);

  const updateStatus = useCallback(async (newStatus: string) => {
    if (state.selectedIds.size === 0) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/bulk-operations/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionIds: Array.from(state.selectedIds),
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const operation = await response.json();
      setState((prev) => ({
        ...prev,
        currentOperation: operation,
        selectedIds: new Set(),
      }));

      return operation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
      throw err;
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [state.selectedIds]);

  const updatePriority = useCallback(async (newPriority: string) => {
    if (state.selectedIds.size === 0) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/bulk-operations/priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionIds: Array.from(state.selectedIds),
          priority: newPriority,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update priority');
      }

      const operation = await response.json();
      setState((prev) => ({
        ...prev,
        currentOperation: operation,
        selectedIds: new Set(),
      }));

      return operation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
      throw err;
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [state.selectedIds]);

  const assignTo = useCallback(async (userId: string) => {
    if (state.selectedIds.size === 0) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/bulk-operations/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionIds: Array.from(state.selectedIds),
          assignedTo: userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign submissions');
      }

      const operation = await response.json();
      setState((prev) => ({
        ...prev,
        currentOperation: operation,
        selectedIds: new Set(),
      }));

      return operation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
      throw err;
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [state.selectedIds]);

  const addToCategory = useCallback(async (category: string) => {
    if (state.selectedIds.size === 0) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/bulk-operations/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionIds: Array.from(state.selectedIds),
          category,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add to category');
      }

      const operation = await response.json();
      setState((prev) => ({
        ...prev,
        currentOperation: operation,
        selectedIds: new Set(),
      }));

      return operation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
      throw err;
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [state.selectedIds]);

  const deleteSelected = useCallback(async () => {
    if (state.selectedIds.size === 0) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/bulk-operations/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionIds: Array.from(state.selectedIds),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete submissions');
      }

      const operation = await response.json();
      setState((prev) => ({
        ...prev,
        currentOperation: operation,
        selectedIds: new Set(),
      }));

      return operation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
      throw err;
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [state.selectedIds]);

  const undo = useCallback(async (operationId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/bulk-operations/${operationId}/undo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to undo operation');
      }

      const operation = await response.json();
      setState((prev) => ({
        ...prev,
        currentOperation: operation,
      }));

      return operation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
      throw err;
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const clearOperation = useCallback(() => {
    setState((prev) => ({ ...prev, currentOperation: null }));
  }, []);

  return {
    selectedIds: state.selectedIds,
    selectedCount: state.selectedIds.size,
    isLoading: state.isLoading,
    currentOperation: state.currentOperation,
    error: state.error,
    toggleSelection,
    selectAll,
    deselectAll,
    updateStatus,
    updatePriority,
    assignTo,
    addToCategory,
    deleteSelected,
    undo,
    clearError,
    clearOperation,
  };
}
