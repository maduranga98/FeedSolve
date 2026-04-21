// Offline support and network error handling

interface CachedData {
  data: any;
  timestamp: number;
  ttl: number;
}

const dataCache = new Map<string, CachedData>();

// Get cached data if available
export function getCachedData(key: string): any | null {
  const cached = dataCache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > cached.ttl) {
    dataCache.delete(key);
    return null;
  }

  return cached.data;
}

// Set cache with TTL (time to live)
export function setCachedData(key: string, data: any, ttlMs: number = 300000) {
  dataCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  });
}

// Clear specific cache entry
export function clearCacheEntry(key: string) {
  dataCache.delete(key);
}

// Clear all cache
export function clearAllCache() {
  dataCache.clear();
}

// Check if online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Hook to listen to online/offline events
export function setupOfflineListener(callback: (isOnline: boolean) => void) {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// Retry logic for failed requests
export async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Don't retry if offline
      if (!isOnline()) {
        throw lastError;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError;
}

// Queue failed operations to retry when back online
class OfflineQueue {
  private queue: Array<{ id: string; fn: () => Promise<void>; retries: number }> = [];
  private isProcessing = false;

  add(id: string, fn: () => Promise<void>) {
    // Prevent duplicates
    if (this.queue.some((item) => item.id === id)) {
      return;
    }

    this.queue.push({ id, fn, retries: 0 });
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || !isOnline()) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue[0];

      try {
        await item.fn();
        this.queue.shift(); // Remove on success
      } catch (error) {
        item.retries++;

        // Remove after 5 failed retries
        if (item.retries >= 5) {
          this.queue.shift();
          console.error(`Offline queue: Failed to process ${item.id} after 5 retries`, error);
        } else {
          // Try again later
          break;
        }
      }
    }

    this.isProcessing = false;
  }

  clear() {
    this.queue = [];
  }

  size() {
    return this.queue.length;
  }
}

export const offlineQueue = new OfflineQueue();

// Listen for online event to retry queue
setupOfflineListener((online) => {
  if (online && offlineQueue.size() > 0) {
    // Small delay to ensure connection is stable
    setTimeout(() => {
      offlineQueue['processQueue']();
    }, 500);
  }
});

// Network error detection
export function isNetworkError(error: any): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('offline')
    );
  }
  return false;
}

// User-friendly error messages
export function getUserFriendlyErrorMessage(error: any): string {
  if (!isOnline()) {
    return 'You are currently offline. Please check your internet connection.';
  }

  if (isNetworkError(error)) {
    return 'Network error. Please check your internet connection and try again.';
  }

  if (error?.code === 'PERMISSION_DENIED') {
    return 'You do not have permission to perform this action.';
  }

  if (error?.code === 'NOT_FOUND') {
    return 'The requested data was not found.';
  }

  if (error?.code === 'ALREADY_EXISTS') {
    return 'This item already exists.';
  }

  if (error?.code === 'INVALID_ARGUMENT') {
    return 'Invalid input. Please check your data and try again.';
  }

  return 'An error occurred. Please try again later.';
}
