import { useState, useEffect, useCallback } from 'react';
import type { BulkOperation } from '../types';

export function useBulkOperationStatus(operationId: string | null) {
  const [operation, setOperation] = useState<BulkOperation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOperation = useCallback(async () => {
    if (!operationId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/bulk-operations/${operationId}`);
      if (!response.ok) throw new Error('Failed to fetch operation status');
      const data = await response.json();
      setOperation(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [operationId]);

  useEffect(() => {
    if (!operationId) return;

    // Initial fetch
    fetchOperation();

    // Poll if still processing
    const interval = setInterval(() => {
      fetchOperation();
    }, 1000); // Poll every second

    return () => clearInterval(interval);
  }, [operationId, fetchOperation]);

  const isProcessing = operation?.status === 'processing';
  const isCompleted = operation?.status === 'completed';
  const isFailed = operation?.status === 'failed';

  return {
    operation,
    isLoading,
    error,
    isProcessing,
    isCompleted,
    isFailed,
    refetch: fetchOperation,
  };
}
