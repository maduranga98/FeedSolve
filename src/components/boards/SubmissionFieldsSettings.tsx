import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ArrowDown, ArrowUp, ClipboardList, Plus, Trash2 } from 'lucide-react';
import type {
  Board,
  SubmissionField,
  SubmissionFieldAppliesTo,
  SubmissionFieldAutoSource,
  SubmissionFieldType,
} from '../../types';
import { Button, Input, Select } from '../Shared';
import { updateBoard } from '../../lib/firestore';
import {
  MAX_SUBMISSION_FIELDS,
  MAX_SUBMISSION_LABEL_LENGTH,
  SUBMISSION_APPLIES_TO_LABELS,
  SUBMISSION_AUTO_SOURCE_LABELS,
  SUBMISSION_FIELD_TYPE_LABELS,
  buildSubmissionConfig,
  getSubmissionConfig,
  normalizeSubmissionFields,
  validateSubmissionFields,
} from '../../lib/submission-fields';

interface SubmissionFieldsSettingsProps {
  board: Board;
  onBoardChange: (board: Board) => void;
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

const hasOptions = (field: SubmissionField) =>
  !field.autoSource && (field.type === 'dropdown' || field.type === 'multiselect');

export function SubmissionFieldsSettings({ board, onBoardChange }: SubmissionFieldsSettingsProps) {
  const initial = getSubmissionConfig(board);
  const [useCustomFields, setUseCustomFields] = useState(initial.useCustomFields);
  const [appliesTo, setAppliesTo] = useState<SubmissionFieldAppliesTo>(initial.appliesTo);
  const [fields, setFields] = useState<SubmissionField[]>(initial.fields);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          return next;
        }

        const type = kind as SubmissionFieldType;
        delete next.autoSource;
        next.type = type;
        if (type === 'dropdown' || type === 'multiselect') next.options = field.options ?? ['', ''];
        else delete next.options;
        return next;
      })
    );
  };

  const moveField = (index: number, direction: -1 | 1) => {
    setFields((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((field, order) => ({ ...field, order }));
    });
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((field) => field.id !== id).map((field, order) => ({ ...field, order })));
  };

  const addField = () => {
    setFields((prev) => [
      ...prev,
      { id: uuidv4(), type: 'text', label: '', required: false, showInList: false, order: prev.length },
    ]);
  };

  const handleSave = async () => {
    setError(null);

    const normalized = normalizeSubmissionFields(fields);
    if (useCustomFields) {
      const validationError = validateSubmissionFields(normalized);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    const submissionConfig = buildSubmissionConfig(useCustomFields, appliesTo, normalized);

    setSaving(true);
    try {
      await updateBoard(board.id, { submissionConfig });
      onBoardChange({ ...board, submissionConfig });
      setFields(submissionConfig.fields);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save submission form settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-[var(--c-bd6cabf)] bg-[var(--c-sffffff)] p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--c-sf5e6df)] text-[var(--c-tc0694a)]">
          <ClipboardList size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-[var(--c-t1c1917)]">Submission Form</h2>
          <p className="mt-1 text-sm text-[var(--c-t78716c)]">
            Replace the Subject and Description fields with your own structured fields, such as batch numbers, root
            cause or checklists. Category stays on the form.
          </p>
        </div>
      </div>

      <div className="space-y-4">
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
                  Public submitters will see every field marked as filled in by a person. Long forms reduce
                  submissions, so keep the public list short.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-[var(--c-be9e0d9)] p-4">
              <h3 className="mb-3 text-sm font-bold text-[var(--c-t1c1917)]">Fields</h3>

              <div className="space-y-3">
                {fields.map((field, index) => (
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

                    {field.autoSource && (
                      <p className="text-xs text-[var(--c-t78716c)]">
                        Filled in automatically and never shown on the form. It appears on the submission details.
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        {!field.autoSource && (
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
                        <label className="flex items-center gap-2 text-sm text-[var(--c-t1c1917)]">
                          <input
                            type="checkbox"
                            checked={field.showInList}
                            onChange={(event) => updateField(field.id, { showInList: event.target.checked })}
                            className="h-4 w-4 accent-[var(--c-sc0694a)]"
                          />
                          Show in submission list
                        </label>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label="Move field up"
                          disabled={index === 0}
                          onClick={() => moveField(index, -1)}
                        >
                          <ArrowUp size={14} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label="Move field down"
                          disabled={index === fields.length - 1}
                          onClick={() => moveField(index, 1)}
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
                ))}

                {fields.length === 0 && (
                  <p className="text-sm text-[var(--c-t78716c)]">No fields yet. Add the first one below.</p>
                )}

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addField}
                  disabled={fields.length >= MAX_SUBMISSION_FIELDS}
                >
                  <Plus size={14} /> Add field
                </Button>
              </div>
            </div>
          </>
        )}

        {error && <p className="text-sm font-semibold text-[var(--c-tc0392b)]">{error}</p>}
        <div className="flex items-center gap-3">
          <Button type="button" variant="primary" onClick={handleSave} isLoading={saving}>
            {saving ? 'Saving…' : 'Save submission form'}
          </Button>
          {saved && <span className="text-sm font-semibold text-[var(--c-t1d8a57)]">Saved</span>}
        </div>
      </div>
    </section>
  );
}
