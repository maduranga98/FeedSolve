const DEFAULT_APP_ORIGIN = 'https://app.feedsolve.com';

export function getAppOrigin(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }

  return import.meta.env.VITE_APP_URL || DEFAULT_APP_ORIGIN;
}
