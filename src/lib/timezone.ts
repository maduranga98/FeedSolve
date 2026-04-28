// Timezone handling utilities

export interface TimezoneInfo {
  name: string;
  offset: string;
  abbreviation: string;
}

// Get all supported timezones
export function getAllTimezones(): string[] {
  return [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Hong_Kong',
    'Asia/Singapore',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Pacific/Auckland',
    'America/Toronto',
    'America/Mexico_City',
    'America/Sao_Paulo',
    'Africa/Johannesburg',
    'Asia/Bangkok',
  ];
}

// Get user's local timezone
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

// Convert UTC date to user's timezone
export function convertToUserTimezone(utcDate: Date | string): Date {
  if (typeof utcDate === 'string') {
    return new Date(utcDate);
  }
  return new Date(utcDate);
}

// Format date in specific timezone
export function formatDateInTimezone(
  date: Date | string,
  timezone: string = getUserTimezone(),
  locale: string = 'en-US'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(dateObj);
  } catch {
    return dateObj.toISOString();
  }
}

// Get timezone offset from UTC
export function getTimezoneOffset(timezone: string): number {
  const now = new Date();
  const utcDate = now.toLocaleString('en-US', { timeZone: 'UTC' });
  const tzDate = now.toLocaleString('en-US', { timeZone: timezone });

  const utcTime = new Date(utcDate).getTime();
  const tzTime = new Date(tzDate).getTime();

  return (tzTime - utcTime) / (1000 * 60 * 60); // Hours
}

// Check if dates are on same day in given timezone
export function isSameDayInTimezone(
  date1: Date,
  date2: Date,
  timezone: string = getUserTimezone()
): boolean {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const formatted1 = formatter.format(date1);
  const formatted2 = formatter.format(date2);

  return formatted1 === formatted2;
}

// Get start and end of day in timezone
export function getDayBoundsInTimezone(
  date: Date,
  timezone: string = getUserTimezone()
): { start: Date; end: Date } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const year = parseInt(parts.find((p) => p.type === 'year')?.value || '1970');
  const month = parseInt(parts.find((p) => p.type === 'month')?.value || '1');
  const day = parseInt(parts.find((p) => p.type === 'day')?.value || '1');

  // Create dates at midnight and end of day
  const offset = getTimezoneOffset(timezone);
  const start = new Date(Date.UTC(year, month - 1, day) - offset * 60 * 60 * 1000);
  const end = new Date(Date.UTC(year, month - 1, day + 1) - offset * 60 * 60 * 1000 - 1000);

  return { start, end };
}

// Localize date string to browser timezone
export function localizeDateString(utcDateString: string, locale: string = 'en-US'): string {
  const date = new Date(utcDateString);
  return date.toLocaleString(locale);
}

// Parse date string considering timezone
export function parseDateString(dateString: string, _timezone: string = getUserTimezone()): Date {
  // Try parsing as ISO string
  const date = new Date(dateString);

  if (!isNaN(date.getTime())) {
    return date;
  }

  // Fallback to current time
  console.warn(`Failed to parse date string: ${dateString}`);
  return new Date();
}
