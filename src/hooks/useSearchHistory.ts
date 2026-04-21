import { useState, useCallback, useEffect } from 'react';
import type { SearchQuery } from '../types';

const STORAGE_KEY = 'feedsolve_search_history';
const MAX_HISTORY = 10;

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchQuery[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to parse search history:', err);
      }
    }
  }, []);

  const addSearch = useCallback((query: string) => {
    setHistory((prev) => {
      const newEntry: SearchQuery = {
        text: query,
        timestamp: { toDate: () => new Date(), toMillis: () => Date.now() } as any,
      };

      const filtered = prev.filter((item) => item.text !== query);
      const updated = [newEntry, ...filtered].slice(0, MAX_HISTORY);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const removeItem = useCallback((query: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.text !== query);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    history,
    addSearch,
    clearHistory,
    removeItem,
  };
}
