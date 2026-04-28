// Security utilities for input validation, sanitization, and common security checks

export interface PasswordValidation {
  valid: boolean;
  score: number; // 0-4
  feedback: string[];
}

export interface EmailValidation {
  valid: boolean;
  reason?: string;
}

export interface URLValidation {
  valid: boolean;
  reason?: string;
}

// Password Validation: Enforce strong password requirements
export function validatePassword(password: string): PasswordValidation {
  const feedback: string[] = [];
  let score = 0;

  // Check length
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Must be at least 8 characters long');
  }

  // Check for uppercase
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Must contain at least one uppercase letter');
  }

  // Check for lowercase
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Must contain at least one lowercase letter');
  }

  // Check for numbers
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Must contain at least one number');
  }

  // Reject common weak passwords
  const weakPasswords = ['password', '12345678', 'qwerty', 'admin', 'letmein'];
  if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
    feedback.push('Password is too common, please choose a different one');
    score = Math.max(0, score - 1);
  }

  return {
    valid: feedback.length === 0,
    score,
    feedback,
  };
}

// Email Validation: Check email format
export function validateEmail(email: string): EmailValidation {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { valid: false, reason: 'Invalid email format' };
  }

  // Reject disposable email domains (common ones)
  const disposableDomains = [
    'tempmail.com',
    'throwaway.email',
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
  ];

  const domain = email.split('@')[1].toLowerCase();
  if (disposableDomains.includes(domain)) {
    return { valid: false, reason: 'Disposable email addresses are not allowed' };
  }

  return { valid: true };
}

// URL Validation: Check if URL is valid and safe
export function validateURL(urlString: string): URLValidation {
  try {
    const url = new URL(urlString);

    // Only allow http and https
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { valid: false, reason: 'Only HTTP and HTTPS URLs are allowed' };
    }

    // Reject localhost and private IPs
    const hostname = url.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    ) {
      return { valid: false, reason: 'Private URLs are not allowed' };
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }
}

// Input Sanitization: Remove HTML/script tags
export function sanitizeInput(input: string): string {
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Remove potentially dangerous characters
  sanitized = sanitized
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Control characters
    .trim();

  return sanitized;
}

// Sanitize for display: Escape HTML
export function escapeHTML(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

// Rate limiting: Check if action should be allowed
const rateLimitStore = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute

export function checkRateLimit(key: string, maxAttempts: number = 5): boolean {
  const now = Date.now();
  const attempts = rateLimitStore.get(key) || [];

  // Remove old attempts outside the window
  const recentAttempts = attempts.filter((time) => now - time < RATE_LIMIT_WINDOW);

  if (recentAttempts.length >= maxAttempts) {
    return false; // Rate limited
  }

  // Record this attempt
  recentAttempts.push(now);
  rateLimitStore.set(key, recentAttempts);

  // Clean up old entries
  if (rateLimitStore.size > 1000) {
    const firstKey = rateLimitStore.keys().next().value;
    if (firstKey !== undefined) rateLimitStore.delete(firstKey);
  }

  return true; // Allowed
}

// CSRF Token generation (simple implementation)
let csrfToken: string | null = null;

export function getCSRFToken(): string {
  if (!csrfToken) {
    csrfToken = generateRandomToken();
    sessionStorage.setItem('csrf_token', csrfToken);
  }
  return csrfToken;
}

export function validateCSRFToken(token: string): boolean {
  const storedToken = sessionStorage.getItem('csrf_token');
  return storedToken === token;
}

// Generate random token for CSRF/security
function generateRandomToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Check for sensitive data in logs/errors
export function maskSensitiveData(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const obj = data as Record<string, unknown>;
  const masked = { ...obj };

  const sensitiveKeys = ['password', 'apiKey', 'secret', 'token', 'creditCard', 'ssn'];

  for (const key of Object.keys(masked)) {
    if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
      masked[key] = '[REDACTED]';
    }
  }

  return masked;
}
