// Concurrency and race condition prevention utilities

// Debounce function to prevent rapid successive calls
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delayMs);
  };
}

// Throttle function to ensure minimum interval between calls
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= delayMs) {
      fn(...args);
      lastCallTime = now;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        fn(...args);
        lastCallTime = Date.now();
        timeoutId = null;
      }, delayMs - timeSinceLastCall);
    }
  };
}

// Prevent double submission
export class SubmissionGuard {
  private isSubmitting = false;
  private timeoutId: NodeJS.Timeout | null = null;

  async execute<T>(fn: () => Promise<T>): Promise<T | null> {
    if (this.isSubmitting) {
      console.warn('Submission already in progress');
      return null;
    }

    this.isSubmitting = true;

    try {
      const result = await fn();
      return result;
    } finally {
      // Add small delay before allowing next submission
      this.timeoutId = setTimeout(() => {
        this.isSubmitting = false;
      }, 200);
    }
  }

  isInProgress(): boolean {
    return this.isSubmitting;
  }

  reset() {
    this.isSubmitting = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}

// Mutex-like lock for shared resource access
export class AsyncLock {
  private locked = false;
  private queue: Array<() => void> = [];

  async acquire<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.locked = false;
          const next = this.queue.shift();
          if (next) {
            next();
          }
        }
      };

      if (!this.locked) {
        this.locked = true;
        execute();
      } else {
        this.queue.push(execute);
      }
    });
  }
}

// Retry with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000,
  maxDelayMs: number = 10000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt < maxRetries - 1) {
        const delay = Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs);
        // Add random jitter (±10%)
        const jitter = delay * 0.1 * (Math.random() * 2 - 1);
        const finalDelay = Math.round(delay + jitter);
        await new Promise((resolve) => setTimeout(resolve, finalDelay));
      }
    }
  }

  throw lastError;
}

// Promise timeout wrapper
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError: Error = new Error('Operation timed out')
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(timeoutError), timeoutMs)
    ),
  ]);
}

// Race condition detector (for development)
export class RaceConditionDetector {
  private activeOperations = new Map<string, number>();

  start(operationId: string) {
    if (this.activeOperations.has(operationId)) {
      console.warn(
        `Race condition detected: ${operationId} started while already in progress`
      );
    }
    this.activeOperations.set(operationId, Date.now());
  }

  end(operationId: string) {
    const startTime = this.activeOperations.get(operationId);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.activeOperations.delete(operationId);

      if (process.env.NODE_ENV === 'development') {
        console.log(`Operation ${operationId} completed in ${duration}ms`);
      }
    }
  }

  isActive(operationId: string): boolean {
    return this.activeOperations.has(operationId);
  }

  clear() {
    this.activeOperations.clear();
  }
}

// Global instance for convenience
export const raceDetector = new RaceConditionDetector();
