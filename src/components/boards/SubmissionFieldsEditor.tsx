import { v4 as uuidv4 } from 'uuid';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type {
  SubmissionField,
  SubmissionFieldAppliesTo,
  SubmissionFieldAudience,
  SubmissionFieldAutoSource,
  SubmissionFieldPhase,
  SubmissionFieldType,
} from '../../types';
import { Button, Input, Select } from '../Shared';
import {
  MAX_SUBMISSION_FIELDS,
  MAX_SUBMISSION_LABEL_LENGTH,
  SUBMISSION_APPLIES_TO_LABELS,
  SUBMISSION_AUDIENCE_LABELS,
  SUBMISSION_AUTO_SOURCE_LABELS,
  SUBMISSION_FIELD_TYPE_LABELS,
  SUBMISSION_PHASE_LABELS,
  getFieldAudience,
  getFieldPhase,
} from '../../lib/submission-fields';

/** Everything the Submission Form editor edits; turned into a stored config by buildSubmissionConfig. */
export interface SubmissionFormDraft {
  useCustomFields: boolean;
  appliesTo: SubmissionFieldAppliesTo;
  fields: SubmissionField[];
  showCategorySelector: boolean;
  allowAttachments: boolean;
  showTrackingCodeToSubmitter: boolean;
}

interface SubmissionFieldsEditorProps {
  value: SubmissionFormDraft;
  onChange: (value: SubmissionFormDraft) => void;
}

const AUTO_PREFIX = 'auto:';

/** One select drives both the input type and the auto-populated sources. */
const FIELD_KIND_OPTIONS = [
  ...(Object.keys(SUBMISSION_FIELD_TYPE_LABELS) as SubmissionFieldType[]).map((type) => ({
    value: type,
    label: SUBMISSION_FIELD_TYPE_LABELS[type],
  })),
  ...(Object.keys(SUBMISSION_AUTO_SOURCE_LABELS) as SubmissionFieldAutoSource[]).map((source) => ({
    value: `${AUTO_PREFIX}${source}`,
    label: SUBMISSION_AUTO_SOURCE_LABELS[source],
  })),
];

const APPLIES_TO_OPTIONS = (Object.keys(SUBMISSION_APPLIES_TO_LABELS) as SubmissionFieldAppliesTo[]).map((value) => ({
  value,
  label: SUBMISSION_APPLIES_TO_LABELS[value],
}));

const AUDIENCE_OPTIONS = (Object.keys(SUBMISSION_AUDIENCE_LABELS) as SubmissionFieldAudience[]).map((value) => ({
  value,
  label: SUBMISSION_AUDIENCE_LABELS[value],
}));

const PHASE_OPTIONS = (Object.keys(SUBMISSION_PHASE_LABELS) as SubmissionFieldPhase[]).map((value) => ({
  value,
  label: SUBMISSION_PHASE_LABELS[value],
}));

type FieldGroup = SubmissionFieldPhase | 'auto';

const groupOf = (field: SubmissionField): FieldGroup => (field.autoSource ? 'auto' : getFieldPhase(field));

const GROUPS: { id: FieldGroup; title: string; hint: string }[] = [
  {
    id: 'intake',
    title: 'At intake',
    hint: 'Asked on the creation forms. Read-only once the submission exists.',
  },
  {
    id: 'resolution',
    title: 'During resolution',
    hint: 'Not on any creation form. Your team fills these in on the submission, and can keep editing them.',
  },
  {
    id: 'auto',
    title: 'Auto-filled',
    hint: 'Read from the submission itself and shown on its details.',
  },
];

const hasOptions = (field: SubmissionField) =>
  !field.autoSource && (field.type === 'dropdown' || field.type === 'multiselect');

export function SubmissionFieldsEditor({ value, onChange }: SubmissionFieldsEditorProps) {
  const { useCustomFields, appliesTo, fields, showCategorySelector, allowAttachments, showTrackingCodeToSubmitter } =
    value;
  const patch = (next: Partial<SubmissionFormDraft>) => onChange({ ...value, ...next });
  const setUseCustomFields = (next: boolean) => patch({ useCustomFields: next });
  const setAppliesTo = (next: SubmissionFieldAppliesTo) => patch({ appliesTo: next });
  const setShowCategorySelector = (next: boolean) => patch({ showCategorySelector: next });
  const setAllowAttachments = (next: boolean) => patch({ allowAttachments: next });
  const setShowTrackingCodeToSubmitter = (next: boolean) => patch({ showTrackingCodeToSubmitter: next });
  const setFields = (update: (prev: SubmissionField[]) => SubmissionField[]) => patch({ fields: update(fields) });

  const updateField = (id: string, patch: Partial<SubmissionField>) => {
    setFields((prev) => prev.map((field) => (field.id === id ? { ...field, ...patch } : field)));
  };

  const changeFieldKind = (id: string, kind: string) => {
    setFields((prev) =>
      prev.map((field) => {
        if (field.id !== id) return field;
        const next: SubmissionField = { ...field };

        if (kind.startsWith(AUTO_PREFIX)) {
          next.type = 'text';
          next.autoSource = kind.slice(AUTO_PREFIX.length) as SubmissionFieldAutoSource;
          next.required = false;
          delete next.options;
          delete next.visibleTo;
          delete next.phase;
          return next;
        }

        const type = kind as SubmissionFieldType;
        delete next.autoSource;
        next.phase = getFieldPhase(field);
        next.type = type;
        if (type === 'dropdown' || type === 'multiselect') next.options = field.options ?? ['', ''];
        else delete next.options;
        return next;
      })
    );
  };

  const changeFieldPhase = (id: string, phase: SubmissionFieldPhase) => {
    setFields((prev) =>
      prev.map((field) => {
        if (field.id !== id) return field;
        const next: SubmissionField = { ...field, phase };
        // Resolution answers are edited by the team on the submission: no audience, never required.
        if (phase === 'resolution') {
          delete next.visibleTo;
          next.required = false;
        }
        return next;
      })
    );
  };

  /** Moves a field up or down within its own group, swapping places with its neighbour there. */
  const moveField = (id: string, direction: -1 | 1) => {
    setFields((prev) => {
      const index = prev.findIndex((field) => field.id === id);
      if (index === -1) return prev;
      const group = groupOf(prev[index]);
      let target = index + direction;
      while (target >= 0 && target < prev.length && groupOf(prev[target]) !== group) target += direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((field, order) => ({ ...field, order }));
    });
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((field) => field.id !== id).map((field, order) => ({ ...field, order })));
  };

  const addField = (phase: SubmissionFieldPhase) => {
    setFields((prev) => [
      ...prev,
      { id: uuidv4(), type: 'text', label: '', required: false, showInList: false, phase, order: prev.length },
    ]);
  };

  const renderFieldCard = (field: SubmissionField, groupIndex: number, groupSize: number) => {
    const index = fields.findIndex((item) => item.id === field.id);
    const phase = getFieldPhase(field);
    const isIntakeInput = !field.autoSource && phase === 'intake';

    return (
      <div
        key={field.id}
        className="space-y-3 rounded-xl border border-[var(--c-be9e0d9)] bg-[var(--c-sf5f0ec)] p-3"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
          <Select
            aria-label={`Field ${index + 1} type`}
            value={field.autoSource ? `${AUTO_PREFIX}${field.autoSource}` : field.type}
            onChange={(event) => changeFieldKind(field.id, event.target.value)}
            options={FIELD_KIND_OPTIONS}
          />
          <Input
            aria-label={`Field ${index + 1} label`}
            value={field.label}
            maxLength={MAX_SUBMISSION_LABEL_LENGTH}
            placeholder="Field label"
            onChange={(event) => updateField(field.id, { label: event.target.value })}
          />
        </div>

        {hasOptions(field) && (
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--c-t78716c)]">
              Options (one per line)
            </label>
            <textarea
              value={(field.options ?? []).join('\n')}
              onChange={(event) => updateField(field.id, { options: event.target.value.split('\n') })}
              rows={3}
              className="w-full resize-none rounded-lg border border-[var(--c-bd6cabf)] bg-[var(--c-sffffff)] px-3 py-2 text-sm focus:border-[var(--c-bc0694a)] focus:outline-none focus:ring-2 focus:ring-[var(--c-bc0694a)]/20"
            />
          </div>
        )}

        {isIntakeInput && getFieldAudience(field) === 'internal' && (
          <p className="text-xs text-[var(--c-t78716c)]">
            Stored privately for your team: never shown to the submitter or in the submission list. Answers are
            final once saved.
          </p>
        )}

        {!field.autoSource && phase === 'resolution' && (
          <p className="text-xs text-[var(--c-t78716c)]">
            Shown on the submission as an empty field until your team fills it in. It is not on the creation forms.
          </p>
        )}

        {field.autoSource && (
          <p className="text-xs text-[var(--c-t78716c)]">
            Filled in automatically and never shown on the form. It appears on the submission details.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {!field.autoSource && (
              <label className="flex items-center gap-2 text-sm text-[var(--c-t1c1917)]">
                Filled
                <span className="w-44">
                  <Select
                    aria-label={`Field ${index + 1} phase`}
                    value={phase}
                    onChange={(event) => changeFieldPhase(field.id, event.target.value as SubmissionFieldPhase)}
                    options={PHASE_OPTIONS}
                  />
                </span>
              </label>
            )}
            {isIntakeInput && (
              <label className="flex items-center gap-2 text-sm text-[var(--c-t1c1917)]">
                Shown to
                <span className="w-52">
                  <Select
                    aria-label={`Field ${index + 1} shown to`}
                    value={getFieldAudience(field)}
                    onChange={(event) =>
                      updateField(field.id, { visibleTo: event.target.value as SubmissionFieldAudience })
                    }
                    options={AUDIENCE_OPTIONS}
                  />
                </span>
              </label>
            )}
            {isIntakeInput && (
              <label className="flex items-center gap-2 text-sm text-[var(--c-t1c1917)]">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(event) => updateField(field.id, { required: event.target.checked })}
                  className="h-4 w-4 accent-[var(--c-sc0694a)]"
                />
                Required
              </label>
            )}
            {(field.autoSource || phase === 'resolution' || getFieldAudience(field) !== 'internal') && (
              <label className="flex items-center gap-2 text-sm text-[var(--c-t1c1917)]">
                <input
                  type="checkbox"
                  checked={field.showInList}
                  onChange={(event) => updateField(field.id, { showInList: event.target.checked })}
                  className="h-4 w-4 accent-[var(--c-sc0694a)]"
                />
                Show in submission list
              </label>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Move field up"
              disabled={groupIndex === 0}
              onClick={() => moveField(field.id, -1)}
            >
              <ArrowUp size={14} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Move field down"
              disabled={groupIndex === groupSize - 1}
              onClick={() => moveField(field.id, 1)}
            >
              <ArrowDown size={14} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Remove field"
              onClick={() => removeField(field.id)}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
    <div className="rounded-xl border border-[var(--c-be9e0d9)] p-4">
      <h3 className="mb-3 text-sm font-bold text-[var(--c-t1c1917)]">Form elements</h3>
      <div className="space-y-3">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={showCategorySelector}
            onChange={(event) => setShowCategorySelector(event.target.checked)}
            className="mt-1 h-4 w-4 accent-[var(--c-sc0694a)]"
          />
          <span>
            <span className="block text-sm font-semibold text-[var(--c-t1c1917)]">Show category selector</span>
            <span className="block text-xs text-[var(--c-t78716c)]">
              When off, new submissions are filed under the board's first category.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={allowAttachments}
            onChange={(event) => setAllowAttachments(event.target.checked)}
            className="mt-1 h-4 w-4 accent-[var(--c-sc0694a)]"
          />
          <span>
            <span className="block text-sm font-semibold text-[var(--c-t1c1917)]">Allow attachments</span>
            <span className="block text-xs text-[var(--c-t78716c)]">
              Controls file uploads on the public form. Existing attachments stay on their submissions.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={showTrackingCodeToSubmitter}
            onChange={(event) => setShowTrackingCodeToSubmitter(event.target.checked)}
            className="mt-1 h-4 w-4 accent-[var(--c-sc0694a)]"
          />
          <span>
            <span className="block text-sm font-semibold text-[var(--c-t1c1917)]">
              Show tracking code to submitter after creation
            </span>
            <span className="block text-xs text-[var(--c-t78716c)]">
              When off, the confirmation just says the submission was received. Your team still sees the code on
              every submission.
            </span>
          </span>
        </label>
      </div>
    </div>

    <label className="flex items-start gap-3 rounded-xl border border-[var(--c-be9e0d9)] bg-[var(--c-sf5f0ec)] p-4">
      <input
        type="checkbox"
        checked={useCustomFields}
        onChange={(event) => setUseCustomFields(event.target.checked)}
        className="mt-1 h-4 w-4 accent-[var(--c-sc0694a)]"
      />
      <span>
        <span className="block text-sm font-bold text-[var(--c-t1c1917)]">Use custom submission fields</span>
        <span className="block text-sm text-[var(--c-t78716c)]">
          Off keeps the standard Category / Subject / Description form.
        </span>
      </span>
    </label>

    {useCustomFields && (
      <>
        <div className="max-w-sm">
          <Select
            label="Applies to"
            value={appliesTo}
            onChange={(event) => setAppliesTo(event.target.value as SubmissionFieldAppliesTo)}
            options={APPLIES_TO_OPTIONS}
          />
          {appliesTo !== 'internal' && (
            <p className="mt-1.5 text-xs text-[var(--c-t78716c)]">
              Public submitters see fields shown to Everyone or Submitter only. Long forms reduce
              submissions, so keep the public list short and mark internal questions Team only.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-[var(--c-be9e0d9)] p-4">
          <h3 className="mb-3 text-sm font-bold text-[var(--c-t1c1917)]">Fields</h3>

          <div className="space-y-3">
{GROUPS.map((group) => {
              const groupFields = fields.filter((field) => groupOf(field) === group.id);
              if (group.id === 'auto' && groupFields.length === 0) return null;
              return (
                <div key={group.id} className="space-y-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-[var(--c-t78716c)]">
                      {group.title}
                    </h4>
                    <p className="text-xs text-[var(--c-t8f8680)]">{group.hint}</p>
                  </div>
                  {groupFields.map((field, groupIndex) => renderFieldCard(field, groupIndex, groupFields.length))}
                  {groupFields.length === 0 && (
                    <p className="text-sm text-[var(--c-t78716c)]">No fields here yet.</p>
                  )}
                  {group.id !== 'auto' && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => addField(group.id as SubmissionFieldPhase)}
                      disabled={fields.length >= MAX_SUBMISSION_FIELDS}
                    >
                      <Plus size={14} /> Add {group.id === 'intake' ? 'intake' : 'resolution'} field
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </>
    )}
    </div>
  );
}
