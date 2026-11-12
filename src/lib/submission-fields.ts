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
  SubmissionFieldPhase,
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

export const SUBMISSION_PHASE_LABELS: Record<SubmissionFieldPhase, string> = {
  intake: 'At intake',
  resolution: 'During resolution',
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

/** Which default (non-custom) form elements a board shows. Independent of custom fields. */
export interface FormElementToggles {
  showCategorySelector: boolean;
  allowAttachments: boolean;
  showTrackingCodeToSubmitter: boolean;
}

export const DEFAULT_FORM_ELEMENT_TOGGLES: FormElementToggles = {
  showCategorySelector: true,
  allowAttachments: true,
  showTrackingCodeToSubmitter: true,
};

/** Fixed form stays the default; custom fields are opt-in and internal-only until widened. */
export const DEFAULT_SUBMISSION_CONFIG: SubmissionConfig = {
  useCustomFields: false,
  appliesTo: 'internal',
  fields: [],
  ...DEFAULT_FORM_ELEMENT_TOGGLES,
};

/**
 * A field's phase. Fields saved before phases existed have none and are intake fields;
 * auto-source fields are never filled by anyone, so they are always treated as intake.
 */
export function getFieldPhase(field: Pick<SubmissionField, 'phase' | 'autoSource'>): SubmissionFieldPhase {
  return field.phase === 'resolution' && !field.autoSource ? 'resolution' : 'intake';
}

export function sortSubmissionFields(fields: SubmissionField[]): SubmissionField[] {
  return [...fields].sort((a, b) => a.order - b.order);
}

/**
 * Fields a person fills in (everything except auto-populated ones). With a `context`,
 * only the fields that creation form asks for: intake-phase "Everyone" fields plus the
 * ones scoped to it. Resolution-phase fields never appear on a creation form.
 */
export function getInputFields(fields: SubmissionField[], context?: SubmissionFormContext): SubmissionField[] {
  return sortSubmissionFields(fields).filter((field) => {
    if (field.autoSource) return false;
    if (!context) return true;
    if (getFieldPhase(field) === 'resolution') return false;
    const audience = getFieldAudience(field);
    return audience === 'all' || audience === context;
  });
}

/** Fields the team fills in on the detail view after the submission exists. */
export function getResolutionFields(fields: SubmissionField[]): SubmissionField[] {
  return getInputFields(fields).filter((field) => getFieldPhase(field) === 'resolution');
}

/** Team-only fields: never on the public form; answers are stored in the team-only subcollection. */
export function getTeamOnlyFields(fields: SubmissionField[]): SubmissionField[] {
  return getInputFields(fields).filter(
    (field) => getFieldPhase(field) === 'intake' && getFieldAudience(field) === 'internal'
  );
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
    showCategorySelector: config.showCategorySelector !== false,
    allowAttachments: config.allowAttachments !== false,
    showTrackingCodeToSubmitter: config.showTrackingCodeToSubmitter !== false,
  };
}

/**
 * Default form element toggles for a board; every element is shown unless explicitly turned off.
 * `planAllowed` is the tier gate (canUseSubmissionFields): without it the toggles are ignored and
 * the standard form is shown, so a company below Growth never gets a stripped-down form.
 */
export function getFormElementToggles(
  board: Pick<Board, 'submissionConfig'> | null | undefined,
  planAllowed: boolean
): FormElementToggles {
  if (!planAllowed) return { ...DEFAULT_FORM_ELEMENT_TOGGLES };
  const config = getSubmissionConfig(board);
  return {
    showCategorySelector: config.showCategorySelector !== false,
    allowAttachments: config.allowAttachments !== false,
    showTrackingCodeToSubmitter: config.showTrackingCodeToSubmitter !== false,
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
    const resolution = getFieldPhase(field) === 'resolution';
    const normalized: SubmissionField = {
      id: field.id,
      type: field.type,
      label: field.label.trim(),
      // Resolution fields are open tasks on the ticket, not intake gates, so they are never required.
      required: field.autoSource || resolution ? false : field.required,
      // Team-only answers are not on the submission document the list reads, so they cannot be listed.
      showInList:
        field.showInList === true && (!!field.autoSource || resolution || getFieldAudience(field) !== 'internal'),
      order: index,
    };
    if (field.autoSource) normalized.autoSource = field.autoSource;
    else {
      normalized.phase = resolution ? 'resolution' : 'intake';
      // Resolution answers live on the submission document and are edited by the team, so
      // audience scoping (which routes answers to the team-only subcollection) does not apply.
      if (!resolution && getFieldAudience(field) !== 'all') normalized.visibleTo = getFieldAudience(field);
    }
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

  // Each form the config applies to needs something to ask. A board with only resolution
  // fields has no custom intake form: it keeps the standard Subject / Description form.
  const hasIntakeFields = getInputFields(fields).some((field) => getFieldPhase(field) === 'intake');
  if (hasIntakeFields && appliesTo !== 'public' && getInputFields(fields, 'internal').length === 0) {
    return 'The internal form has no fields. Add an intake field shown to Everyone or Team only.';
  }
  if (hasIntakeFields && appliesTo !== 'internal' && getInputFields(fields, 'public').length === 0) {
    return 'The public form has no fields. Add an intake field shown to Everyone or Submitter only.';
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
    if (getFieldPhase(field) === 'resolution') spec.phase = 'resolution';
    else if (getFieldAudience(field) !== 'all') spec.audience = getFieldAudience(field);
    specs[field.id] = spec;
  }
  return specs;
}

/** The persisted shape: normalized fields plus the derived rules index. */
export function buildSubmissionConfig(
  useCustomFields: boolean,
  appliesTo: SubmissionFieldAppliesTo,
  fields: SubmissionField[],
  elements: FormElementToggles = DEFAULT_FORM_ELEMENT_TOGGLES
): SubmissionConfig {
  const normalized = normalizeSubmissionFields(fields);
  return {
    useCustomFields,
    appliesTo,
    fields: normalized,
    fieldSpecs: buildFieldSpecs(normalized),
    showCategorySelector: elements.showCategorySelector,
    allowAttachments: elements.allowAttachments,
    showTrackingCodeToSubmitter: elements.showTrackingCodeToSubmitter,
  };
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

/** False for an untouched form: nothing answered and no box ticked. */
export function hasMeaningfulAnswers(entries: SubmissionCustomFieldValue[]): boolean {
  return entries.some((entry) => entry.value !== false);
}

/** Form state for a set of fields, pre-filled from the answers already saved on the submission. */
export function answersFromEntries(
  fields: SubmissionField[],
  entries: SubmissionCustomFieldValue[] | undefined
): SubmissionAnswers {
  const valuesById = new Map((entries ?? []).map((entry) => [entry.fieldId, entry.value]));
  const answers: SubmissionAnswers = {};
  for (const field of fields) {
    const value = valuesById.get(field.id);
    if (value !== undefined) answers[field.id] = value;
  }
  return answers;
}

/**
 * Applies resolution-phase answers to a submission's stored entries, in the positional shape
 * firestore.rules requires (see isResolutionFieldsChange): every existing entry keeps its
 * index and is returned untouched unless it belongs to one of `resolutionFields`, in which
 * case only its value changes; answers with no entry yet are appended. Entries are never
 * removed, so clearing an answer stores an empty value ('' / [] / false) that every reader
 * treats as "not filled in". Checkboxes get a new entry only once ticked, so saving another
 * field never invents a "No" for a box nobody touched.
 */
export function mergeResolutionAnswers(
  resolutionFields: SubmissionField[],
  existing: SubmissionCustomFieldValue[],
  answers: SubmissionAnswers
): SubmissionCustomFieldValue[] {
  const fieldsById = new Map(getInputFields(resolutionFields).map((field) => [field.id, field]));
  const written = new Set<string>();

  const valueFor = (field: SubmissionField): SubmissionCustomFieldValueType => {
    const value = answers[field.id];
    if (field.type === 'checkbox') return value === true;
    if (field.type === 'multiselect') return Array.isArray(value) ? value : [];
    return typeof value === 'string' ? value.trim() : '';
  };

  const result = existing.map((entry) => {
    const field = fieldsById.get(entry.fieldId);
    if (!field || written.has(field.id)) return entry;
    written.add(field.id);
    return { fieldId: field.id, value: valueFor(field) };
  });

  for (const field of fieldsById.values()) {
    if (written.has(field.id)) continue;
    const value = valueFor(field);
    if (!isEmptyAnswer(value) && value !== false) result.push({ fieldId: field.id, value });
  }

  return result;
}

/**
 * firestore.rules checks a `customFields` update entry by entry and has a hard budget of 1000
 * expressions per request, which roughly 5 changed entries consume on a 15-field board. Writes
 * are therefore split so no single update changes more than this many entries.
 * Keep in sync with the note above isResolutionFieldsChange in firestore.rules.
 */
export const MAX_RESOLUTION_ENTRY_CHANGES_PER_WRITE = 3;

/**
 * Splits the change from `current` to `target` (as produced by mergeResolutionAnswers) into
 * the successive full arrays to write. Each one differs from the previous by at most
 * `maxChanges` entries, and each is itself a valid update under the positional rule, so a write
 * that fails part-way leaves a consistent submission and a retry simply continues. Empty when
 * nothing changed.
 */
export function planResolutionWrites(
  current: SubmissionCustomFieldValue[],
  target: SubmissionCustomFieldValue[],
  maxChanges: number = MAX_RESOLUTION_ENTRY_CHANGES_PER_WRITE
): SubmissionCustomFieldValue[][] {
  const changed: number[] = [];
  target.forEach((entry, index) => {
    const before = current[index];
    if (!before || before.fieldId !== entry.fieldId || JSON.stringify(before.value) !== JSON.stringify(entry.value)) {
      changed.push(index);
    }
  });

  const writes: SubmissionCustomFieldValue[][] = [];
  const working = [...current];
  for (let start = 0; start < changed.length; start += maxChanges) {
    // Indices past the end of `current` ascend without gaps, so assigning them appends in order.
    for (const index of changed.slice(start, start + maxChanges)) working[index] = target[index];
    writes.push([...working]);
  }
  return writes;
}

/** True when two answer maps hold the same value for every one of `fields`. */
export function areAnswersEqual(
  fields: SubmissionField[],
  a: SubmissionAnswers,
  b: SubmissionAnswers
): boolean {
  const normalize = (value: SubmissionCustomFieldValueType | undefined) =>
    typeof value === 'string' ? value.trim() : Array.isArray(value) ? [...value].sort().join('\u0000') : value ?? null;
  return fields.every((field) => {
    const left = normalize(a[field.id]);
    const right = normalize(b[field.id]);
    // An unticked checkbox and a missing answer are the same state.
    if (field.type === 'checkbox') return (left === true) === (right === true);
    return (left === '' ? null : left) === (right === '' ? null : right);
  });
}

/**
 * Splits internal-form answers by where they are stored: team-only answers go to the
 * team-only subcollection, everything else onto the submission document.
 */
export function splitTeamAnswers(
  fields: SubmissionField[],
  entries: SubmissionCustomFieldValue[]
): { shared: SubmissionCustomFieldValue[]; team: SubmissionCustomFieldValue[] } {
  const teamIds = new Set(getTeamOnlyFields(fields).map((field) => field.id));
  return {
    shared: entries.filter((entry) => !teamIds.has(entry.fieldId)),
    team: entries.filter((entry) => teamIds.has(entry.fieldId)),
  };
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
  phase: SubmissionFieldPhase;
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
  options: {
    listOnly?: boolean;
    assigneeName?: string | null;
    /** Team-only answers loaded from the teamFields subcollection (detail view only). */
    teamFields?: SubmissionCustomFieldValue[];
  } = {}
): SubmissionFieldDisplay[] {
  if (!submission.customFields) return [];

  const definitions = getSubmissionConfig(board).fields;
  const stored = [...submission.customFields, ...(options.teamFields ?? [])];
  const valuesById = new Map(stored.map((entry) => [entry.fieldId, entry.value]));
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
          phase: 'intake',
          removed: false,
        });
      }
      continue;
    }

    const answer = valuesById.get(field.id);
    if (answer === undefined) continue;
    const value = formatCustomFieldValue(field, answer);
    if (!value) continue;
    displays.push({
      id: field.id,
      label: field.label,
      value,
      type: field.type,
      audience: getFieldAudience(field),
      phase: getFieldPhase(field),
      removed: false,
    });
  }

  if (!options.listOnly) {
    const definedIds = new Set(definitions.map((field) => field.id));
    for (const entry of stored) {
      if (definedIds.has(entry.fieldId)) continue;
      const value = formatCustomFieldValue({ type: 'text' }, entry.value);
      if (value) {
        displays.push({
          id: entry.fieldId,
          label: 'Removed field',
          value,
          type: 'text',
          audience: 'all',
          phase: 'intake',
          removed: true,
        });
      }
    }
  }

  return displays;
}
