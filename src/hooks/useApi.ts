import { useCallback, useState, useEffect } from 'react';
import { APIClient, APIError } from '../lib/api-client';

// Create a singleton instance for the current user
let apiClientInstance: APIClient | null = null;

export function useApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<APIError | null>(null);

  const getClient = useCallback((): APIClient => {
    if (!apiClientInstance) {
      // In a real implementation, this would get the API key from localStorage
      // or from auth context after the user creates/manages API keys
      throw new Error('API client not initialized');
    }
    return apiClientInstance;
  }, []);

  const initializeClient = useCallback((apiKey: string) => {
    apiClientInstance = new APIClient({
      apiKey,
      baseUrl: import.meta.env.VITE_API_URL || 'https://api.feedsolve.com',
    });
  }, []);

  const execute = useCallback(
    async <T,>(fn: (client: APIClient) => Promise<T>): Promise<T> => {
      setIsLoading(true);
      setError(null);
      try {
        const client = getClient();
        const result = await fn(client);
        return result;
      } catch (err) {
        const apiError = err instanceof APIError ? err : new APIError(String(err), 500, null);
        setError(apiError);
        throw apiError;
      } finally {
        setIsLoading(false);
      }
    },
    [getClient]
  );

  return {
    client: apiClientInstance || null,
    isLoading,
    error,
    execute,
    initializeClient,
    getClient,
  };
}

/**
 * Hook for making API requests with loading and error handling
 *
 * Usage:
 * const { data, isLoading, error, refetch } = useApiData(
 *   (client) => client.submissions.list()
 * );
 */
export function useApiData<T>(
  fetcher: (client: APIClient) => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);
  const { client } = useApi();

  const refetch = useCallback(async () => {
    if (!client) {
      setError(new APIError('API client not initialized', 0, null));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher(client);
      setData(result);
    } catch (err) {
      const apiError = err instanceof APIError ? err : new APIError(String(err), 500, null);
      setError(apiError);
    } finally {
      setIsLoading(false);
    }
  }, [client, fetcher]);

  // Initial fetch on mount
  useEffect(() => {
    refetch();
  }, [refetch, ...dependencies]);

  return { data, isLoading, error, refetch };
}
