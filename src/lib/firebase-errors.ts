// Maps Firebase Auth and Firestore error codes to user-friendly messages.
const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  // Auth — sign-in
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'No account found with this email address.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/too-many-requests': 'Too many failed attempts. Please wait a moment and try again.',
  // Auth — sign-up
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled.',
  // Auth — social
  'auth/account-exists-with-different-credential':
    'An account already exists with a different sign-in method for this email.',
  'auth/popup-blocked': 'Sign-in popup was blocked by your browser. Please allow popups and try again.',
  // Network / connectivity
  'auth/network-request-failed': 'Network error. Please check your connection and try again.',
  // Firestore quota / limits
  'resource-exhausted': 'Service is temporarily unavailable due to high demand. Please try again in a moment.',
  'quota-exceeded': 'Service quota exceeded. Please try again later or contact support.',
  // Firestore permission
  'permission-denied': 'You do not have permission to perform this action.',
  'unauthenticated': 'You must be signed in to perform this action.',
  // Firestore availability
  'unavailable': 'Service is temporarily unavailable. Please try again shortly.',
  'deadline-exceeded': 'The request timed out. Please try again.',
  'not-found': 'The requested data was not found.',
  'already-exists': 'This item already exists.',
  'cancelled': 'The operation was cancelled.',
  'internal': 'An internal error occurred. Please try again.',
};

export function getFirebaseErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    if (FIREBASE_ERROR_MESSAGES[code]) {
      return FIREBASE_ERROR_MESSAGES[code];
    }
    // Firestore gRPC-style codes like "firestore/resource-exhausted"
    const shortCode = code.split('/').pop() ?? code;
    if (FIREBASE_ERROR_MESSAGES[shortCode]) {
      return FIREBASE_ERROR_MESSAGES[shortCode];
    }
  }
  if (error instanceof Error && error.message) {
    // Strip the raw Firebase prefix ("Firebase: Error (auth/...).")
    const cleaned = error.message.replace(/^Firebase:\s*/i, '').replace(/\s*\(.*\)\.$/, '').trim();
    if (cleaned) return cleaned;
  }
  return 'Something went wrong. Please try again.';
}

export function isQuotaError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    return code.includes('resource-exhausted') || code.includes('quota-exceeded');
  }
  return false;
}

export function isNetworkFirebaseError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    return (
      code === 'auth/network-request-failed' ||
      code.includes('unavailable') ||
      code.includes('deadline-exceeded')
    );
  }
  return false;
}
