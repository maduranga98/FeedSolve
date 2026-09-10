import type { CategoryTranslations } from '../types';

/**
 * Resolve the label to show for a category in a given language.
 * Falls back to the canonical category name when no translation exists.
 */
export function getCategoryLabel(
  category: string,
  lang: string | undefined,
  translations?: CategoryTranslations
): string {
  if (lang) {
    const translated = translations?.[category]?.[lang];
    if (translated && translated.trim()) return translated.trim();
  }
  return category;
}

/**
 * Remove empty/whitespace translations and any entries that no longer
 * correspond to an existing category or a currently supported language.
 * Produces a clean map safe to persist to Firestore.
 */
export function pruneCategoryTranslations(
  categories: string[],
  supportedLanguages: string[],
  translations: CategoryTranslations | undefined
): CategoryTranslations {
  const result: CategoryTranslations = {};
  if (!translations) return result;
  for (const category of categories) {
    const langMap = translations[category];
    if (!langMap) continue;
    const cleaned: Record<string, string> = {};
    for (const lang of supportedLanguages) {
      const value = langMap[lang]?.trim();
      if (value) cleaned[lang] = value;
    }
    if (Object.keys(cleaned).length > 0) result[category] = cleaned;
  }
  return result;
}

export function generateTrackingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '#FSV-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateBoardSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getStatusColor(status: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    received: { bg: 'bg-[var(--c-seff3f6)]', text: 'text-[var(--c-t6b7b8d)]' },
    in_review: { bg: 'bg-[var(--c-sebf5fb)]', text: 'text-[var(--c-t185fa5)]' },
    in_progress: { bg: 'bg-[var(--c-sfef5e7)]', text: 'text-[var(--c-t854f0b)]' },
    escalated: { bg: 'bg-[var(--c-sfdecea)]', text: 'text-[var(--c-tc0392b)]' },
    resolved: { bg: 'bg-[var(--c-sebf9f1)]', text: 'text-[var(--c-t0f6e56)]' },
    closed: { bg: 'bg-[var(--c-sf1efe8)]', text: 'text-[var(--c-t5f5e5a)]' },
  };
  return colors[status] || colors.received;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    received: 'Received',
    in_review: 'In Review',
    in_progress: 'In Progress',
    escalated: 'Escalated',
    resolved: 'Resolved',
    closed: 'Closed',
  };
  return labels[status] || status;
}
