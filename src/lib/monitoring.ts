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

  // Get Sentry DSN from environment
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

  if (!sentryDsn) {
    console.warn('[Monitoring] Sentry DSN not configured');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: isProduction ? 'production' : 'staging',
    integrations: [
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, hint) {
      // Don't send errors from localhost
      if (
        event.request?.url &&
        event.request.url.includes('localhost')
      ) {
        return null;
      }

      // Don't send network errors (user's problem)
      if (hint.originalException instanceof TypeError) {
        const error = hint.originalException as Error;
        if (error.message.includes('fetch') || error.message.includes('network')) {
          return null;
        }
      }

      return event;
    },
  });

  console.log('[Monitoring] Sentry initialized');
}

// Event tracking for analytics
export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

const analyticsQueue: AnalyticsEvent[] = [];

export function trackEvent(event: AnalyticsEvent) {
  analyticsQueue.push(event);

  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event);
  }

  // Send to Sentry for breadcrumbs
  Sentry.captureMessage(`${event.category}:${event.action}`, 'info');
}

// Track page views
export function trackPageView(pageName: string, properties?: Record<string, any>) {
  trackEvent({
    category: 'Page',
    action: 'View',
    label: pageName,
  });

  Sentry.setTag('page', pageName);
  if (properties) {
    Sentry.setContext('page_properties', properties);
  }
}

// Track feature usage
export function trackFeatureUsage(feature: string, action: string) {
  trackEvent({
    category: 'Feature',
    action: action,
    label: feature,
  });

  Sentry.addBreadcrumb({
    category: 'feature',
    message: `${feature}: ${action}`,
    level: 'info',
  });
}

// Track errors
export function trackError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: {
      error_context: context || {},
    },
  });

  console.error('[Error]', error, context);
}

// Track performance metrics
export function trackPerformanceMetric(name: string, value: number, unit: string = 'ms') {
  Sentry.captureMessage(`Performance: ${name}=${value}${unit}`, 'info');

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${name}: ${value}${unit}`);
  }
}

// Set user context
export function setUserContext(userId: string, email: string, properties?: Record<string, any>) {
  Sentry.setUser({
    id: userId,
    email: email,
    ...properties,
  });
}

// Clear user context on logout
export function clearUserContext() {
  Sentry.setUser(null);
}

// Create custom span for performance monitoring
export function createPerformanceSpan(operation: string): {
  end: () => void;
  addTag: (key: string, value: any) => void;
} {
  const startTime = performance.now();
  const tags: Record<string, any> = {};

  return {
    end: () => {
      const duration = performance.now() - startTime;
      trackPerformanceMetric(operation, duration, 'ms');
    },
    addTag: (key: string, value: any) => {
      tags[key] = value;
    },
  };
}

// Session heartbeat - track active sessions
let heartbeatInterval: NodeJS.Timeout | null = null;

export function startSessionHeartbeat() {
  if (heartbeatInterval) return;

  heartbeatInterval = setInterval(() => {
    trackEvent({
      category: 'Session',
      action: 'Heartbeat',
    });
  }, 5 * 60 * 1000); // Every 5 minutes
}

export function stopSessionHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// Get analytics queue for reporting
export function getAnalyticsQueue(): AnalyticsEvent[] {
  return [...analyticsQueue];
}

// Clear analytics queue
export function clearAnalyticsQueue() {
  analyticsQueue.length = 0;
}

// Custom error boundaries
export function captureErrorBoundary(error: Error, errorInfo: React.ErrorInfo) {
  Sentry.withScope((scope) => {
    scope.setTag('error_boundary', true);
    scope.setContext('errorInfo', {
      componentStack: errorInfo.componentStack,
    });
    Sentry.captureException(error);
  });
}

// Monitor database operations
export function monitorDatabaseOperation<T>(
  operationName: string,
  fn: () => Promise<T>
): Promise<T> {
  const span = createPerformanceSpan(`database:${operationName}`);

  return fn()
    .then((result) => {
      span.end();
      return result;
    })
    .catch((error) => {
      span.end();
      trackError(error, { operation: operationName });
      throw error;
    });
}

// Monitor API calls
export function monitorApiCall<T>(
  endpoint: string,
  method: string,
  fn: () => Promise<T>
): Promise<T> {
  const span = createPerformanceSpan(`api:${method}:${endpoint}`);

  return fn()
    .then((result) => {
      span.end();
      return result;
    })
    .catch((error) => {
      span.end();
      trackError(error, { endpoint, method });
      throw error;
    });
}
