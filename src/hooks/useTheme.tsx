import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  applyTheme,
  getStoredThemeMode,
  resolveTheme,
  storeThemeMode,
  watchSystemTheme,
  type ResolvedTheme,
  type ThemeMode,
} from '../lib/theme';

type ThemeContextValue = {
  /** What the user picked: an explicit theme, or `system` to follow the OS. */
  mode: ThemeMode;
  /** What is actually on screen right now. */
  theme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  /** Flips between light and dark, leaving `system` behind. */
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getStoredThemeMode);
  const [theme, setTheme] = useState<ResolvedTheme>(() => resolveTheme(getStoredThemeMode()));

  // The document already carries the right theme on mount — the inline script
  // in index.html applies it before first paint — so the only thing left to
  // watch for is the OS flipping underneath a `system` preference.
  useEffect(() => {
    if (mode !== 'system') return;
    return watchSystemTheme(() => setTheme(applyTheme('system')));
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    storeThemeMode(next);
    setModeState(next);
    setTheme(applyTheme(next));
  }, []);

  const toggle = useCallback(() => {
    setMode(theme === 'dark' ? 'light' : 'dark');
  }, [setMode, theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, theme, setMode, toggle }),
    [mode, theme, setMode, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
