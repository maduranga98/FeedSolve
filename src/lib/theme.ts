/**
 * Theme store.
 *
 * The resolved theme is written to `data-theme` on <html>; every colour token
 * in `index.css` keys off that attribute, so switching is a single attribute
 * write with no re-render of the tree required. The same logic runs from an
 * inline script in `index.html` before first paint to avoid a flash of the
 * wrong theme.
 */

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'feedsolve_theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

const isMode = (value: unknown): value is ThemeMode =>
  value === 'light' || value === 'dark' || value === 'system';

/** Reads the persisted preference, falling back to following the OS. */
export function getStoredThemeMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isMode(stored) ? stored : 'system';
  } catch {
    // Private-mode browsers and blocked storage: follow the OS instead.
    return 'system';
  }
}

export function prefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(DARK_QUERY).matches;
}

export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') return prefersDark() ? 'dark' : 'light';
  return mode;
}

/** Applies the resolved theme to the document and returns what was applied. */
export function applyTheme(mode: ThemeMode): ResolvedTheme {
  const resolved = resolveTheme(mode);
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', resolved === 'dark' ? '#201e1c' : '#f5f0ec');
  return resolved;
}

export function storeThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Preference simply will not persist; the session still switches.
  }
}

/** Subscribes to OS changes. Returns an unsubscribe function. */
export function watchSystemTheme(onChange: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
