type RdtFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    rdt?: RdtFn;
  }
}

const uniqueId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * Fires a Reddit conversion event with a unique conversionId. The same ID is
 * sent to the server-side Conversions API so Reddit can deduplicate the two.
 * Never throws; safe when the pixel is blocked.
 */
export function trackRedditEvent(
  eventName: string,
  opts: { conversionId?: string; email?: string } = {},
) {
  try {
    const conversionId = opts.conversionId ?? uniqueId();

    if (typeof window.rdt === 'function') {
      window.rdt('track', eventName, { conversionId });
    }

    const url = import.meta.env.VITE_REDDIT_CAPI_URL as string | undefined;
    if (url) {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName, conversionId, email: opts.email }),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* tracking must never break auth */
  }
}
