// Monitoring and analytics utilities
import * as Sentry from '@sentry/react';

// Initialize Sentry error tracking
export function initializeSentry() {
  const isDevelopment = import.meta.env.MODE === 'development';
  const isProduction = import.meta.env.MODE === 'production';

  if (isDevelopment) {
    console.log('[Monitoring] Sentry disabled in development');
    return;
  }

  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

  if (!sentryDsn) {
    console.warn('[Monitoring] Sentry DSN not configured');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: isProduction ? 'production' : 'staging',
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, hint) {
      if (event.request?.url && event.request.url.includes('localhost')) {
        return null;
      }
      if (hint.originalException instanceof TypeError) {
        const error = hint.originalException as Error;
        if (error.message.includes('fetch') || error.message.includes('network')) {
          return null;
        }
      }

      // Track error rate for critical alerting
      recordErrorTimestamp();

      return event;
    },
  });

  console.log('[Monitoring] Sentry initialized');
}

// ─── Critical error rate tracking ────────────────────────────────────────────
// Keeps a sliding window of error timestamps. Fires a Sentry alert when
// more than CRITICAL_ERROR_THRESHOLD errors occur within CRITICAL_ERROR_WINDOW_MS.

const CRITICAL_ERROR_THRESHOLD = 5;
const CRITICAL_ERROR_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const errorTimestamps: number[] = [];

function recordErrorTimestamp() {
  const now = Date.now();
  errorTimestamps.push(now);

  // Evict timestamps outside the sliding window
  const cutoff = now - CRITICAL_ERROR_WINDOW_MS;
  while (errorTimestamps.length > 0 && errorTimestamps[0] < cutoff) {
    errorTimestamps.shift();
  }

  if (errorTimestamps.length >= CRITICAL_ERROR_THRESHOLD) {
    Sentry.captureMessage(
      `Critical error rate: ${errorTimestamps.length} errors in the last hour`,
      'fatal'
    );
    // Reset to avoid repeated alerts for the same burst
    errorTimestamps.length = 0;
  }
}

// ─── Analytics event types ────────────────────────────────────────────────────

export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  properties?: Record<string, unknown>;
}

const analyticsQueue: AnalyticsEvent[] = [];

export function trackEvent(event: AnalyticsEvent) {
  analyticsQueue.push(event);

  if (import.meta.env.MODE === 'development') {
    console.log('[Analytics]', event);
  }

  Sentry.addBreadcrumb({
    category: event.category,
    message: `${event.action}${event.label ? `: ${event.label}` : ''}`,
    level: 'info',
    data: event.properties,
  });
}

// ─── Domain-specific analytics events ────────────────────────────────────────

export function trackSubmissionCreated(properties: {
  boardId: string;
  companyId: string;
  category: string;
  isAnonymous: boolean;
}) {
  trackEvent({
    category: 'Submission',
    action: 'Created',
    properties,
  });
}

export function trackBoardCreated(properties: {
  boardId: string;
  companyId: string;
  categoryCount: number;
  fromTemplate: boolean;
}) {
  trackEvent({
    category: 'Board',
    action: 'Created',
    properties,
  });
}

export function trackStatusChanged(properties: {
  submissionId: string;
  fromStatus: string;
  toStatus: string;
  companyId?: string;
}) {
  trackEvent({
    category: 'Submission',
    action: 'StatusChanged',
    label: `${properties.fromStatus} → ${properties.toStatus}`,
    properties,
  });
}

export function trackUserSignedUp(properties: {
  userId: string;
  method: 'email' | 'google' | 'apple';
}) {
  trackEvent({
    category: 'User',
    action: 'SignedUp',
    label: properties.method,
    properties,
  });
}

// ─── Page views & feature usage ──────────────────────────────────────────────

export function trackPageView(pageName: string, properties?: Record<string, unknown>) {
  trackEvent({
    category: 'Page',
    action: 'View',
    label: pageName,
    properties,
  });
  Sentry.setTag('page', pageName);
  if (properties) {
    Sentry.setContext('page_properties', properties);
  }
}

export function trackFeatureUsage(feature: string, action: string) {
  trackEvent({
    category: 'Feature',
    action,
    label: feature,
  });
}

// ─── Error tracking ───────────────────────────────────────────────────────────

export function trackError(error: Error, context?: Record<string, unknown>) {
  recordErrorTimestamp();
  Sentry.captureException(error, {
    contexts: { error_context: context || {} },
  });
  console.error('[Error]', error, context);
}

// ─── Performance monitoring ───────────────────────────────────────────────────

const SLOW_DB_THRESHOLD_MS = 500;
const SLOW_RENDER_THRESHOLD_MS = 100;

export function trackPerformanceMetric(name: string, value: number, unit: string = 'ms') {
  if (import.meta.env.MODE === 'development') {
    console.log(`[Performance] ${name}: ${value}${unit}`);
  }

  // Alert on slow database queries
  if (name.startsWith('database:') && value > SLOW_DB_THRESHOLD_MS) {
    Sentry.captureMessage(`Slow database query: ${name} took ${value}ms`, 'warning');
  }

  // Alert on slow UI renders
  if (name.startsWith('render:') && value > SLOW_RENDER_THRESHOLD_MS) {
    Sentry.captureMessage(`Slow UI render: ${name} took ${value}ms`, 'warning');
  }
}

export function createPerformanceSpan(operation: string): {
  end: () => void;
  addTag: (key: string, value: unknown) => void;
} {
  const startTime = performance.now();
  const tags: Record<string, unknown> = {};

  return {
    end: () => {
      const duration = performance.now() - startTime;
      tags['durationMs'] = duration;
      trackPerformanceMetric(operation, Math.round(duration), 'ms');
    },
    addTag: (key: string, value: unknown) => {
      tags[key] = value;
    },
  };
}

// ─── User context ─────────────────────────────────────────────────────────────

export function setUserContext(
  userId: string,
  email: string,
  properties?: Record<string, unknown>
) {
  Sentry.setUser({ id: userId, email, ...properties });
}

export function clearUserContext() {
  Sentry.setUser(null);
}

// ─── Database & API monitoring wrappers ──────────────────────────────────────

export function monitorDatabaseOperation<T>(
  operationName: string,
  fn: () => Promise<T>
): Promise<T> {
  const span = createPerformanceSpan(`database:${operationName}`);
  return fn()
    .then((result) => { span.end(); return result; })
    .catch((error) => {
      span.end();
      trackError(error, { operation: operationName });
      throw error;
    });
}

export function monitorApiCall<T>(
  endpoint: string,
  method: string,
  fn: () => Promise<T>
): Promise<T> {
  const span = createPerformanceSpan(`api:${method}:${endpoint}`);
  return fn()
    .then((result) => { span.end(); return result; })
    .catch((error) => {
      span.end();
      trackError(error, { endpoint, method });
      throw error;
    });
}

// ─── Session heartbeat ────────────────────────────────────────────────────────

let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

export function startSessionHeartbeat() {
  if (heartbeatInterval) return;
  heartbeatInterval = setInterval(() => {
    trackEvent({ category: 'Session', action: 'Heartbeat' });
  }, 5 * 60 * 1000);
}

export function stopSessionHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// ─── Error boundary helper ────────────────────────────────────────────────────

export function captureErrorBoundary(error: Error, errorInfo: React.ErrorInfo) {
  recordErrorTimestamp();
  Sentry.withScope((scope) => {
    scope.setTag('error_boundary', true);
    scope.setContext('errorInfo', { componentStack: errorInfo.componentStack });
    Sentry.captureException(error);
  });
}

// ─── Analytics queue helpers ──────────────────────────────────────────────────

export function getAnalyticsQueue(): AnalyticsEvent[] {
  return [...analyticsQueue];
}

export function clearAnalyticsQueue() {
  analyticsQueue.length = 0;
}

// ─── Performance init ─────────────────────────────────────────────────────────

export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  // Observe long tasks (renders / JS blocking >50 ms)
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > SLOW_RENDER_THRESHOLD_MS) {
            trackPerformanceMetric(`render:long-task`, Math.round(entry.duration), 'ms');
          }
        }
      });
      observer.observe({ type: 'longtask', buffered: true });
    } catch {
      // longtask not supported in all browsers
    }
  }
}
