import { subDays, startOfDay, endOfDay } from 'date-fns';

export type DateRangePreset = '7days' | '30days' | '90days' | 'custom';

export interface DateRange {
  from: Date;
  to: Date;
  preset?: DateRangePreset;
}

export function getDateRangePreset(preset: DateRangePreset): DateRange {
  const now = new Date();
  const to = endOfDay(now);

  switch (preset) {
    case '7days':
      return {
        from: startOfDay(subDays(now, 7)),
        to,
        preset: '7days',
      };
    case '30days':
      return {
        from: startOfDay(subDays(now, 30)),
        to,
        preset: '30days',
      };
    case '90days':
      return {
        from: startOfDay(subDays(now, 90)),
        to,
        preset: '90days',
      };
    case 'custom':
      return {
        from: startOfDay(now),
        to,
        preset: 'custom',
      };
    default:
      return {
        from: startOfDay(subDays(now, 30)),
        to,
        preset: '30days',
      };
  }
}

export function isDateInRange(date: Date, range: DateRange): boolean {
  return date >= range.from && date <= range.to;
}

export function formatDateRange(range: DateRange): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `${formatter.format(range.from)} - ${formatter.format(range.to)}`;
}

export function getPresetLabel(preset: DateRangePreset): string {
  switch (preset) {
    case '7days':
      return 'Last 7 Days';
    case '30days':
      return 'Last 30 Days';
    case '90days':
      return 'Last 90 Days';
    case 'custom':
      return 'Custom Range';
    default:
      return 'Last 30 Days';
  }
}
