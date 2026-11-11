import type {
  Board,
  Submission,
  SubmissionConfig,
  SubmissionCustomFieldValue,
  SubmissionCustomFieldValueType,
  SubmissionField,
  SubmissionFieldAppliesTo,
  SubmissionFieldAudience,
  SubmissionFieldAutoSource,
  SubmissionFieldSpec,
  SubmissionFieldType,
} from '../types';
import {
  MAX_FEEDBACK_LABEL_LENGTH,
  MAX_FEEDBACK_OPTIONS,
  MAX_FEEDBACK_OPTION_LENGTH,
} from './feedback';
import { DESCRIPTION_MAX, SUBJECT_MAX } from './submission-validation';
import { getStatusLabel } from './utils';

/*
 * Custom submission fields: the intake-form counterpart of lib/feedback.ts.
 * Limits mirror firestore.rules (see isValidCustomFieldValue). Text values reuse the
 * fixed Subject / Description limits so a custom field never accepts more than the
 * fixed form does.
 */

/** Keep in sync with the unrolled entry checks in firestore.rules (isValidCustomFieldEntries). */
export const MAX_SUBMISSION_FIELDS = 15;
export const MAX_SUBMISSION_LABEL_LENGTH = MAX_FEEDBACK_LABEL_LENGTH;
export const MAX_SUBMISSION_OPTIONS = MAX_FEEDBACK_OPTIONS;
export const MAX_SUBMISSION_OPTION_LENGTH = MAX_FEEDBACK_OPTION_LENGTH;
export const MAX_SUBMISSION_TEXT_LENGTH = SUBJECT_MAX;
export const MAX_SUBMISSION_TEXTAREA_LENGTH = DESCRIPTION_MAX;

export const SUBMISSION_FIELD_TYPE_LABELS: Record<SubmissionFieldType, string> = {
  text: 'Short text',
  textarea: 'Long text',
  dropdown: 'Dropdown',
  date: 'Date',
  checkbox: 'Checkbox',
  multiselect: 'Multi-select',
};

export const SUBMISSION_AUTO_SOURCE_LABELS: Record<SubmissionFieldAutoSource, string> = {
  createdAt: 'Auto: Date submitted',
  trackingCode: 'Auto: Tracking code',
  assignedTo: 'Auto: Assigned to',
  status: 'Auto: Status',
};

export const SUBMISSION_APPLIES_TO_LABELS: Record<SubmissionFieldAppliesTo, string> = {
  internal: 'Internal only (team members)',
  public: 'Public form only',
  both: 'Both internal and public',
};

export const SUBMISSION_AUDIENCE_LABELS: Record<SubmissionFieldAudience, string> = {
  all: 'Everyone',
  public: 'Submitter only (public form)',
  internal: 'Team only (internal)',
};

export type SubmissionFormContext = 'internal' | 'public';

export function getFieldAudience(field: Pick<SubmissionField, 'visibleTo'>): SubmissionFieldAudience {
  return field.visibleTo === 'public' || field.visibleTo === 'internal' ? field.visibleTo : 'all';
}

/** Fixed form stays the default; custom fields are opt-in and internal-only until widened. */
export const DEFAULT_SUBMISSION_CONFIG: SubmissionConfig = {
  useCustomFields: false,
  appliesTo: 'internal',
  fields: [],
};

export function sortSubmissionFields(fields: SubmissionField[]): SubmissionField[] {
  return [...fields].sort((a, b) => a.order - b.order);
}

/**
 * Fields a person fills in (everything except auto-populated ones). With a `context`,
 * only the fields that form asks for: "Everyone" fields plus the ones scoped to it.
 */
export function getInputFields(fields: SubmissionField[], context?: SubmissionFormContext): SubmissionField[] {
  return sortSubmissionFields(fields).filter((field) => {
    if (field.autoSource) return false;
    if (!context) return true;
    const audience = getFieldAudience(field);
    return audience === 'all' || audience === context;
  });
}

/** Team-only fields: never on the public form, and editable from the submission detail view. */
export function getTeamOnlyFields(fields: SubmissionField[]): SubmissionField[] {
  return getInputFields(fields).filter((field) => getFieldAudience(field) === 'internal');
}

/** Board config with defaults applied for boards that predate the feature. */
export function getSubmissionConfig(board: Pick<Board, 'submissionConfig'> | null | undefined): SubmissionConfig {
  const config = board?.submissionConfig;
  if (!config) return DEFAULT_SUBMISSION_CONFIG;

  return {
    useCustomFields: config.useCustomFields === true,
    appliesTo: config.appliesTo === 'public' || config.appliesTo === 'both' ? config.appliesTo : 'internal',
    fields: Array.isArray(config.fields) ? sortSubmissionFields(config.fields) : [],
    fieldSpecs: config.fieldSpecs,
  };
}

/**
 * Whether the creation form for `context` should render the custom field list instead of
 * the fixed Subject/Description pair. `planAllowed` is the tier gate (canUseSubmissionFields);
 * it is required so a downgraded company falls back to the fixed form, matching firestore.rules.
 * Category stays on the form in both modes because it still routes the submission.
 */
export function isCustomFormActive(
  board: Pick<Board, 'submissionConfig'> | null | undefined,
  context: SubmissionFormContext,
  planAllowed: boolean
): boolean {
  if (!planAllowed) return false;
  const config = getSubmissionConfig(board);
  if (!config.useCustomFields) return false;
  if (config.appliesTo !== 'both' && config.appliesTo !== context) return false;
  return getInputFields(config.fields, context).length > 0;
}

/** Trims labels/options, drops blanks and re-numbers `order` to match array position. */
export function normalizeSubmissionFields(fields: SubmissionField[]): SubmissionField[] {
  return fields.map((field, index) => {
    const normalized: SubmissionField = {
      id: field.id,
      type: field.type,
      label: field.label.trim(),
      required: field.autoSource ? false : field.required,
      showInList: field.showInList === true,
      order: index,
    };
    if (field.autoSource) normalized.autoSource = field.autoSource;
    else if (getFieldAudience(field) !== 'all') normalized.visibleTo = getFieldAudience(field);
    if (!field.autoSource && (field.type === 'dropdown' || field.type === 'multiselect')) {
      normalized.options = (field.options ?? []).map((option) => option.trim()).filter(Boolean);
    }
    return normalized;
  });
}

/** Returns an error message for a normalized field list, or null when it is valid. */
export function validateSubmissionFields(
  fields: SubmissionField[],
  appliesTo: SubmissionFieldAppliesTo = 'internal'
): string | null {
  if (fields.length === 0) return 'Add at least one submission field.';
  if (fields.length > MAX_SUBMISSION_FIELDS) return `You can add up to ${MAX_SUBMISSION_FIELDS} fields.`;
  if (getInputFields(fields).length === 0) {
    return 'Add at least one field that people fill in. Auto-filled fields alone cannot make a submission.';
  }

  // Each form the config applies to needs something to ask.
  if (appliesTo !== 'public' && getInputFields(fields, 'internal').length === 0) {
    return 'The internal form has no fields. Add a field shown to Everyone or Team only.';
  }
  if (appliesTo !== 'internal' && getInputFields(fields, 'public').length === 0) {
    return 'The public form has no fields. Add a field shown to Everyone or Submitter only.';
  }

  const seenLabels = new Set<string>();
  for (const [index, field] of fields.entries()) {
    const position = `Field ${index + 1}`;
    if (!field.label) return `${position} needs a label.`;
    if (field.label.length > MAX_SUBMISSION_LABEL_LENGTH) {
      return `${position} label must be ${MAX_SUBMISSION_LABEL_LENGTH} characters or fewer.`;
    }
    const labelKey = field.label.toLowerCase();
    if (seenLabels.has(labelKey)) return `${position} has the same label as another field.`;
    seenLabels.add(labelKey);

    if (!field.autoSource && (field.type === 'dropdown' || field.type === 'multiselect')) {
      const options = field.options ?? [];
      const noun = field.type === 'dropdown' ? 'dropdown' : 'multi-select';
      if (options.length < 2) return `${position} needs at least two ${noun} options.`;
      if (options.length > MAX_SUBMISSION_OPTIONS) {
        return `${position} can have up to ${MAX_SUBMISSION_OPTIONS} options.`;
      }
      if (new Set(options).size !== options.length) return `${position} has duplicate options.`;
      if (options.some((option) => option.length > MAX_SUBMISSION_OPTION_LENGTH)) {
        return `${position} options must be ${MAX_SUBMISSION_OPTION_LENGTH} characters or fewer.`;
      }
    }
  }

  return null;
}

/**
 * firestore.rules cannot iterate a list, so the board also stores the user-entered
 * fields as a map keyed by field id. Rules use it to validate each submitted value.
 */
export function buildFieldSpecs(fields: SubmissionField[]): Record<string, SubmissionFieldSpec> {
  const specs: Record<string, SubmissionFieldSpec> = {};
  for (const field of fields) {
    if (field.autoSource) continue;
    const spec: SubmissionFieldSpec = { type: field.type };
    if (field.type === 'dropdown' || field.type === 'multiselect') spec.options = field.options ?? [];
    if (getFieldAudience(field) !== 'all') spec.audience = getFieldAudience(field);
    specs[field.id] = spec;
  }
  return specs;
}

/** The persisted shape: normalized fields plus the derived rules index. */
export function buildSubmissionConfig(
  useCustomFields: boolean,
  appliesTo: SubmissionFieldAppliesTo,
  fields: SubmissionField[]
): SubmissionConfig {
  const normalized = normalizeSubmissionFields(fields);
  return { useCustomFields, appliesTo, fields: normalized, fieldSpecs: buildFieldSpecs(normalized) };
}

export type SubmissionAnswers = Record<string, SubmissionCustomFieldValueType | undefined>;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function isEmptyAnswer(value: SubmissionCustomFieldValueType | undefined): boolean {
  if (value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/** Client-side validation. Returns a map of fieldId -> error message (empty when valid). */
export function validateSubmissionAnswers(
  fields: SubmissionField[],
  answers: SubmissionAnswers
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of getInputFields(fields)) {
    const value = answers[field.id];

    if (field.type === 'checkbox') {
      if (field.required && value !== true) errors[field.id] = 'This box must be checked.';
      continue;
    }

    if (isEmptyAnswer(value)) {
      if (field.required) {
        errors[field.id] = field.type === 'multiselect' ? 'Choose at least one option.' : 'This field is required.';
      }
      continue;
    }

    const options = field.options ?? [];
    if (field.type === 'dropdown') {
      if (!(typeof value === 'string' && options.includes(value))) {
        errors[field.id] = 'Please choose one of the options.';
      }
    } else if (field.type === 'multiselect') {
      const valid =
        Array.isArray(value) &&
        new Set(value).size === value.length &&
        value.every((item) => options.includes(item));
      if (!valid) errors[field.id] = 'Please choose only from the listed options.';
    } else if (field.type === 'date') {
      if (!(typeof value === 'string' && isValidDateString(value))) errors[field.id] = 'Please enter a valid date.';
    } else if (field.type === 'text') {
      if (typeof value === 'string' && value.trim().length > MAX_SUBMISSION_TEXT_LENGTH) {
        errors[field.id] = `Please keep this under ${MAX_SUBMISSION_TEXT_LENGTH} characters.`;
      }
    } else if (field.type === 'textarea') {
      if (typeof value === 'string' && value.trim().length > MAX_SUBMISSION_TEXTAREA_LENGTH) {
        errors[field.id] = `Please keep this under ${MAX_SUBMISSION_TEXTAREA_LENGTH} characters.`;
      }
    }
  }

  return errors;
}

/**
 * Converts form state to the stored shape: answered fields only, in field order, strings
 * trimmed. Checkboxes are always stored because an unticked box is a meaningful answer.
 */
export function buildSubmissionCustomFields(
  fields: SubmissionField[],
  answers: SubmissionAnswers
): SubmissionCustomFieldValue[] {
  const result: SubmissionCustomFieldValue[] = [];

  for (const field of getInputFields(fields)) {
    const value = answers[field.id];
    if (field.type === 'checkbox') {
      result.push({ fieldId: field.id, value: value === true });
      continue;
    }
    if (isEmptyAnswer(value) || value === undefined) continue;
    result.push({ fieldId: field.id, value: typeof value === 'string' ? value.trim() : value });
  }

  return result;
}

/**
 * Applies a team edit: replaces the stored answers of `editedFields` with `answers` and
 * leaves every other answer (including the submitter's) untouched.
 */
export function mergeCustomFieldEdits(
  existing: SubmissionCustomFieldValue[],
  editedFields: SubmissionField[],
  answers: SubmissionAnswers
): SubmissionCustomFieldValue[] {
  const editedIds = new Set(editedFields.map((field) => field.id));
  return [
    ...existing.filter((entry) => !editedIds.has(entry.fieldId)),
    ...buildSubmissionCustomFields(editedFields, answers),
  ];
}

function formatDateValue(value: string): string {
  if (!isValidDateString(value)) return value;
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(
    new Date(year, month - 1, day)
  );
}

/** Human-readable value for the detail view, list cards, derived description and CSV. */
export function formatCustomFieldValue(
  field: Pick<SubmissionField, 'type'>,
  value: SubmissionCustomFieldValueType | undefined
): string {
  if (value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  return field.type === 'date' ? formatDateValue(value) : value;
}

/**
 * Auto-source fields are never stored: they are read from the submission document
 * (the same createdAt / trackingCode / assignedTo / status values every other view uses),
 * so they cannot go stale when a submission is reassigned or moves status.
 */
export function resolveAutoSourceValue(
  source: SubmissionFieldAutoSource,
  submission: Pick<Submission, 'createdAt' | 'trackingCode' | 'assignedTo' | 'status'>,
  assigneeName?: string | null
): string {
  switch (source) {
    case 'createdAt':
      return submission.createdAt
        ? new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(
            submission.createdAt.toDate()
          )
        : '';
    case 'trackingCode':
      return submission.trackingCode;
    case 'assignedTo':
      return submission.assignedTo ? assigneeName || 'Assigned' : 'Unassigned';
    case 'status':
      return getStatusLabel(submission.status);
  }
}

/**
 * The fixed form requires a subject and description, and the tracking page, public feed,
 * search, exports and security rules all read them. For a custom-field submission they are
 * derived once at write time: the subject is the first answered text-like field, and the
 * description is a "Label: value" summary of every answer.
 */
export function deriveSubmissionSummary(
  fields: SubmissionField[],
  customFields: SubmissionCustomFieldValue[],
  trackingCode: string
): { subject: string; description: string } {
  const valuesById = new Map(customFields.map((entry) => [entry.fieldId, entry.value]));
  const inputFields = getInputFields(fields);

  let subject = '';
  for (const field of inputFields) {
    const value = valuesById.get(field.id);
    if (typeof value === 'string' && value.trim() && field.type !== 'date') {
      subject = value.trim().split('\n')[0];
      break;
    }
  }
  subject = (subject || `Submission ${trackingCode}`).slice(0, SUBJECT_MAX);

  const lines: string[] = [];
  for (const field of inputFields) {
    const value = valuesById.get(field.id);
    if (value === undefined) continue;
    const text = formatCustomFieldValue(field, value);
    if (text) lines.push(`${field.label}: ${text}`);
  }
  const description = (lines.join('\n') || subject).slice(0, DESCRIPTION_MAX);

  return { subject, description };
}

export interface SubmissionFieldDisplay {
  id: string;
  label: string;
  value: string;
  type: SubmissionFieldType;
  autoSource?: SubmissionFieldAutoSource;
  audience: SubmissionFieldAudience;
  /** True when the board no longer defines this field but the submission still holds an answer. */
  removed: boolean;
}

/**
 * Maps field definitions onto a submission's stored answers (matching by fieldId), in
 * definition order. Shared by the detail view and the list card. Answers whose definition
 * was deleted are kept (labelled as removed) rather than silently dropped. Submissions
 * without `customFields` (fixed form) produce nothing.
 */
export function getSubmissionFieldDisplays(
  board: Pick<Board, 'submissionConfig'> | null | undefined,
  submission: Pick<Submission, 'customFields' | 'createdAt' | 'trackingCode' | 'assignedTo' | 'status'>,
  options: { listOnly?: boolean; assigneeName?: string | null } = {}
): SubmissionFieldDisplay[] {
  if (!submission.customFields) return [];

  const definitions = getSubmissionConfig(board).fields;
  const valuesById = new Map(submission.customFields.map((entry) => [entry.fieldId, entry.value]));
  const displays: SubmissionFieldDisplay[] = [];

  for (const field of definitions) {
    if (options.listOnly && !field.showInList) continue;

    if (field.autoSource) {
      const value = resolveAutoSourceValue(field.autoSource, submission, options.assigneeName);
      if (value) {
        displays.push({
          id: field.id,
          label: field.label,
          value,
          type: field.type,
          autoSource: field.autoSource,
          audience: 'all',
          removed: false,
        });
      }
      continue;
    }

    const stored = valuesById.get(field.id);
    if (stored === undefined) continue;
    const value = formatCustomFieldValue(field, stored);
    if (!value) continue;
    displays.push({
      id: field.id,
      label: field.label,
      value,
      type: field.type,
      audience: getFieldAudience(field),
      removed: false,
    });
  }

  if (!options.listOnly) {
    const definedIds = new Set(definitions.map((field) => field.id));
    for (const entry of submission.customFields) {
      if (definedIds.has(entry.fieldId)) continue;
      const value = formatCustomFieldValue({ type: 'text' }, entry.value);
      if (value) {
        displays.push({
          id: entry.fieldId,
          label: 'Removed field',
          value,
          type: 'text',
          audience: 'all',
          removed: true,
        });
      }
    }
  }

  return displays;
}
