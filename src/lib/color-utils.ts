function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

export function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const amount = (255 * percent) / 100;
  return rgbToHex(rgb.r + amount, rgb.g + amount, rgb.b + amount);
}

export function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const amount = (255 * percent) / 100;
  return rgbToHex(rgb.r - amount, rgb.g - amount, rgb.b - amount);
}

export function colorWithOpacity(hex: string, opacity: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

export interface BrandColorTheme {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryBg: string;
  primaryBorder: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  textOnPrimary: string;
  textOnSecondary: string;
}

function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return true;
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5;
}

export function generateColorTheme(
  primary: string,
  secondary: string
): BrandColorTheme {
  return {
    primary,
    primaryLight: lightenColor(primary, 20),
    primaryDark: darkenColor(primary, 15),
    primaryBg: colorWithOpacity(primary, 0.08),
    primaryBorder: colorWithOpacity(primary, 0.2),
    secondary,
    secondaryLight: lightenColor(secondary, 20),
    secondaryDark: darkenColor(secondary, 15),
    textOnPrimary: isLightColor(primary) ? "#1E3A5F" : "#FFFFFF",
    textOnSecondary: isLightColor(secondary) ? "#1E3A5F" : "#FFFFFF",
  };
}

export const DEFAULT_COLOR_THEME: BrandColorTheme = generateColorTheme(
  "#2E86AB",
  "#1E3A5F"
);

export function applyBrandColors(
  element: HTMLElement | null,
  primary?: string,
  secondary?: string
): void {
  if (!element) return;
  const theme =
    primary && secondary
      ? generateColorTheme(primary, secondary)
      : DEFAULT_COLOR_THEME;

  element.style.setProperty("--brand-primary", theme.primary);
  element.style.setProperty("--brand-primary-light", theme.primaryLight);
  element.style.setProperty("--brand-primary-dark", theme.primaryDark);
  element.style.setProperty("--brand-primary-bg", theme.primaryBg);
  element.style.setProperty("--brand-primary-border", theme.primaryBorder);
  element.style.setProperty("--brand-secondary", theme.secondary);
  element.style.setProperty("--brand-secondary-light", theme.secondaryLight);
  element.style.setProperty("--brand-secondary-dark", theme.secondaryDark);
  element.style.setProperty(
    "--brand-text-on-primary",
    theme.textOnPrimary
  );
  element.style.setProperty(
    "--brand-text-on-secondary",
    theme.textOnSecondary
  );
}
