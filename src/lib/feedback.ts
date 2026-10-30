import type {
  Board,
  FeedbackAnswer,
  FeedbackAnswerValue,
  FeedbackConfig,
  FeedbackField,
  FeedbackFieldType,
} from '../types';

export const MAX_FEEDBACK_FIELDS = 10;
export const MAX_FEEDBACK_LABEL_LENGTH = 120;
export const MAX_FEEDBACK_OPTIONS = 20;
export const MAX_FEEDBACK_OPTION_LENGTH = 80;
export const MAX_FEEDBACK_SHORT_TEXT_LENGTH = 200;
export const MAX_FEEDBACK_LONG_TEXT_LENGTH = 2000;

export const FEEDBACK_FIELD_TYPE_LABELS: Record<FeedbackFieldType, string> = {
  rating: 'Rating',
  text: 'Short text',
  textarea: 'Long text',
  dropdown: 'Dropdown',
  yesno: 'Yes / No',
};

/** Fixed field set used by Free and Starter boards: one rating + one optional comment. */
export const DEFAULT_FEEDBACK_FIELDS: FeedbackField[] = [
  {
    id: 'rating',
    type: 'rating',
    label: 'How satisfied are you with how this was handled?',
    required: true,
    order: 0,
  },
  {
    id: 'comment',
    type: 'textarea',
    label: 'Anything else you would like to share?',
    required: false,
    order: 1,
  },
];

export const DEFAULT_FEEDBACK_CONFIG: FeedbackConfig = {
  enabled: false,
  triggerStatus: 'resolved',
  fields: DEFAULT_FEEDBACK_FIELDS,
};

export function sortFeedbackFields(fields: FeedbackField[]): FeedbackField[] {
  return [...fields].sort((a, b) => a.order - b.order);
}

/** Board config with defaults applied for boards that predate the feature. */
export function getFeedbackConfig(board: Pick<Board, 'feedbackConfig'>): FeedbackConfig {
  const config = board.feedbackConfig;
  if (!config) return DEFAULT_FEEDBACK_CONFIG;

  return {
    enabled: config.enabled === true,
    triggerStatus: config.triggerStatus === 'closed' ? 'closed' : 'resolved',
    fields: config.fields && config.fields.length > 0 ? sortFeedbackFields(config.fields) : DEFAULT_FEEDBACK_FIELDS,
  };
}

/**
 * One response per submission: the document ID is derived from the tracking
 * code ("#FSV-AB12" -> "FSV-AB12"), so a second create hits an existing doc and
 * is rejected by the security rules (create-only, no update).
 */
export function feedbackResponseId(trackingCode: string): string {
  return trackingCode.replace(/^#/, '');
}

/** Trims labels/options, drops blanks and re-numbers `order` to match array position. */
export function normalizeFeedbackFields(fields: FeedbackField[]): FeedbackField[] {
  return fields.map((field, index) => {
    const normalized: FeedbackField = {
      id: field.id,
      type: field.type,
      label: field.label.trim(),
      required: field.required,
      order: index,
    };
    if (field.type === 'dropdown') {
      normalized.options = (field.options ?? []).map((option) => option.trim()).filter(Boolean);
    }
    return normalized;
  });
}

/** Returns an error message for a normalized field list, or null when it is valid. */
export function validateFeedbackFields(fields: FeedbackField[]): string | null {
  if (fields.length === 0) return 'Add at least one feedback field.';
  if (fields.length > MAX_FEEDBACK_FIELDS) return `You can add up to ${MAX_FEEDBACK_FIELDS} fields.`;

  for (const [index, field] of fields.entries()) {
    const position = `Field ${index + 1}`;
    if (!field.label) return `${position} needs a label.`;
    if (field.label.length > MAX_FEEDBACK_LABEL_LENGTH) {
      return `${position} label must be ${MAX_FEEDBACK_LABEL_LENGTH} characters or fewer.`;
    }
    if (field.type === 'dropdown') {
      const options = field.options ?? [];
      if (options.length < 2) return `${position} needs at least two dropdown options.`;
      if (options.length > MAX_FEEDBACK_OPTIONS) {
        return `${position} can have up to ${MAX_FEEDBACK_OPTIONS} options.`;
      }
      if (new Set(options).size !== options.length) return `${position} has duplicate options.`;
      if (options.some((option) => option.length > MAX_FEEDBACK_OPTION_LENGTH)) {
        return `${position} options must be ${MAX_FEEDBACK_OPTION_LENGTH} characters or fewer.`;
      }
    }
  }

  return null;
}

export type FeedbackAnswers = Record<string, FeedbackAnswerValue | undefined>;

function isEmptyAnswer(value: FeedbackAnswerValue | undefined): boolean {
  return value === undefined || (typeof value === 'string' && value.trim() === '');
}

/** Client-side validation. Returns a map of fieldId -> error message (empty when valid). */
export function validateFeedbackAnswers(
  fields: FeedbackField[],
  answers: FeedbackAnswers
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const value = answers[field.id];

    if (isEmptyAnswer(value)) {
      if (field.required) {
        errors[field.id] = field.type === 'rating' ? 'Please choose a rating.' : 'This field is required.';
      }
      continue;
    }

    if (field.type === 'rating' && !(typeof value === 'number' && value >= 1 && value <= 5)) {
      errors[field.id] = 'Please choose a rating.';
    } else if (field.type === 'yesno' && typeof value !== 'boolean') {
      errors[field.id] = 'Please choose Yes or No.';
    } else if (field.type === 'dropdown' && !(typeof value === 'string' && field.options?.includes(value))) {
      errors[field.id] = 'Please choose one of the options.';
    } else if (field.type === 'text' && typeof value === 'string' && value.length > MAX_FEEDBACK_SHORT_TEXT_LENGTH) {
      errors[field.id] = `Please keep this under ${MAX_FEEDBACK_SHORT_TEXT_LENGTH} characters.`;
    } else if (field.type === 'textarea' && typeof value === 'string' && value.length > MAX_FEEDBACK_LONG_TEXT_LENGTH) {
      errors[field.id] = `Please keep this under ${MAX_FEEDBACK_LONG_TEXT_LENGTH} characters.`;
    }
  }

  return errors;
}

/** Converts form state to the stored shape: answered fields only, in field order, strings trimmed. */
export function buildFeedbackAnswers(fields: FeedbackField[], answers: FeedbackAnswers): FeedbackAnswer[] {
  const result: FeedbackAnswer[] = [];

  for (const field of sortFeedbackFields(fields)) {
    const value = answers[field.id];
    if (isEmptyAnswer(value) || value === undefined) continue;
    result.push({ fieldId: field.id, value: typeof value === 'string' ? value.trim() : value });
  }

  return result;
}

/** Human-readable value for tables and CSV. */
export function formatFeedbackValue(field: FeedbackField, value: FeedbackAnswerValue | undefined): string {
  if (value === undefined) return '';
  if (field.type === 'yesno') return value === true ? 'Yes' : value === false ? 'No' : String(value);
  return String(value);
}
