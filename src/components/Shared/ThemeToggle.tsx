import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import type { ThemeMode } from '../../lib/theme';

type ThemeToggleProps = {
  /**
   * `segmented` exposes light / system / dark explicitly and suits settings
   * and navigation surfaces; `icon` is a single button that flips between
   * light and dark, for tight headers such as the public form.
   */
  variant?: 'segmented' | 'icon';
  className?: string;
};

const OPTIONS: Array<{ mode: ThemeMode; icon: typeof Sun; labelKey: string }> = [
  { mode: 'light', icon: Sun, labelKey: 'theme_light' },
  { mode: 'system', icon: Monitor, labelKey: 'theme_system' },
  { mode: 'dark', icon: Moon, labelKey: 'theme_dark' },
];

export function ThemeToggle({ variant = 'segmented', className = '' }: ThemeToggleProps) {
  const { mode, theme, setMode, toggle } = useTheme();
  const { t } = useTranslation();

  if (variant === 'icon') {
    const Icon = theme === 'dark' ? Sun : Moon;
    return (
      <button
        type="button"
        onClick={toggle}
        title={t('theme_toggle')}
        aria-label={t('theme_toggle')}
        className={`inline-flex items-center justify-center w-9 h-9 rounded-full border border-color-border bg-color-surface text-color-muted-text transition-colors duration-150 hover:text-color-accent hover:border-color-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-color-accent ${className}`}
      >
        <Icon size={16} />
      </button>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label={t('theme')}
      className={`inline-flex items-center gap-0.5 p-0.5 rounded-full border border-color-border bg-color-bg ${className}`}
    >
      {OPTIONS.map(({ mode: optionMode, icon: Icon, labelKey }) => {
        const active = mode === optionMode;
        return (
          <button
            key={optionMode}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setMode(optionMode)}
            title={t(labelKey)}
            aria-label={t(labelKey)}
            className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-color-accent ${
              active
                ? 'bg-color-surface text-color-accent shadow-sm'
                : 'text-color-muted-text hover:text-color-body-text'
            }`}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Fixed-position toggle for pages that have no chrome of their own — the
 * public feedback form, tracking and resolution pages, and the auth screens.
 * Uses logical inset properties so it stays out of the way in RTL locales.
 */
export function FloatingThemeToggle({ className = '' }: { className?: string }) {
  return (
    <ThemeToggle
      variant="icon"
      className={`fixed top-4 end-4 z-50 shadow-sm backdrop-blur ${className}`}
    />
  );
}
