import type { TFunction } from 'i18next';
import type { Board, SubmissionFormInput } from '../types';

export const SUBJECT_MAX = 100;
export const DESCRIPTION_MAX = 5000;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates the category. Category stays on every form, fixed or custom, because it
 * routes the submission. Mirrors the category check in `isValidInternalSubmissionCreate()`.
 */
export function validateSubmissionCategory(
  category: string,
  board: Pick<Board, 'categories'> | null,
  t: TFunction
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!category) {
    errors.category = t('forms:feedback.category') + ' ' + t('forms:validation.required');
  } else if (board && board.categories.length > 0 && !board.categories.includes(category)) {
    errors.category = t('forms:validation.invalid_category') || 'Invalid category selected';
  }

  return errors;
}

/**
 * Validates the fields every fixed-form submission shares (category, subject, description),
 * whether it comes from the public form or is logged by a team member. The limits
 * mirror `isValidSubmissionCreate()` in firestore.rules.
 */
export function validateSubmissionContent(
  input: Pick<SubmissionFormInput, 'category' | 'subject' | 'description'>,
  board: Pick<Board, 'categories'> | null,
  t: TFunction
): Record<string, string> {
  const errors = validateSubmissionCategory(input.category, board, t);

  const subject = input.subject.trim();
  if (!subject) {
    errors.subject = t('forms:feedback.subject') + ' ' + t('forms:validation.required');
  } else if (subject.length > SUBJECT_MAX) {
    errors.subject = t('forms:validation.subject_max', { max: SUBJECT_MAX });
  }

  const description = input.description.trim();
  if (!description) {
    errors.description = t('forms:feedback.description') + ' ' + t('forms:validation.required');
  } else if (description.length > DESCRIPTION_MAX) {
    errors.description = t('forms:validation.description_max', { max: DESCRIPTION_MAX });
  }

  return errors;
}
