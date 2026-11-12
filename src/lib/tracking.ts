type Oaiq = (...args: unknown[]) => void;

declare global {
  interface Window {
    oaiq?: Oaiq;
  }
}

const KEY_PREFIX = 'oaiq_sent_';

function alreadySent(key: string): boolean {
  try {
    return localStorage.getItem(KEY_PREFIX + key) !== null;
  } catch {
    return false;
  }
}

function markSent(key: string): void {
  try {
    localStorage.setItem(KEY_PREFIX + key, '1');
  } catch {
    /* storage unavailable */
  }
}

/** Fire once per dedupe key. Returns true if the event was sent. */
function measureOnce(
  dedupeKey: string,
  name: string,
  data: Record<string, unknown>,
  options?: Record<string, unknown>,
): boolean {
  if (typeof window === 'undefined' || typeof window.oaiq !== 'function') return false;
  if (alreadySent(dedupeKey)) return false;
  if (options) window.oaiq('measure', name, data, options);
  else window.oaiq('measure', name, data);
  markSent(dedupeKey);
  return true;
}

/** Call only after the backend has confirmed an active paid subscription. */
export function trackSubscriptionCreated(subscriptionId: string, planId: string): boolean {
  if (!subscriptionId || !planId) return false;
  return measureOnce(
    `sub_${subscriptionId}`,
    'subscription_created',
    { type: 'plan_enrollment', plan_id: planId },
    { event_id: subscriptionId },
  );
}

/** Call only after an account was successfully created. */
export function trackLeadCreated(userId: string): boolean {
  return measureOnce(`lead_${userId}`, 'lead_created', { type: 'customer_action' });
}
