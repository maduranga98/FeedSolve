import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ArrowDown, ArrowUp, Lock, MessageSquare, Plus, Trash2 } from 'lucide-react';
import type { Board, Company, FeedbackConfig, FeedbackField, FeedbackFieldType } from '../../types';
import { Button, Input, Select } from '../Shared';
import { updateBoard } from '../../lib/firestore';
import { hasFeature } from '../../lib/tier-limits';
import {
  DEFAULT_FEEDBACK_FIELDS,
  FEEDBACK_FIELD_TYPE_LABELS,
  MAX_FEEDBACK_FIELDS,
  MAX_FEEDBACK_LABEL_LENGTH,
  getFeedbackConfig,
  normalizeFeedbackFields,
  validateFeedbackFields,
} from '../../lib/feedback';

interface FeedbackConfigSettingsProps {
  board: Board;
  company: Company | null;
  onBoardChange: (board: Board) => void;
}

const FIELD_TYPE_OPTIONS = (Object.keys(FEEDBACK_FIELD_TYPE_LABELS) as FeedbackFieldType[]).map((type) => ({
  value: type,
  label: FEEDBACK_FIELD_TYPE_LABELS[type],
}));

const TRIGGER_STATUS_OPTIONS = [
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export function FeedbackConfigSettings({ board, company, onBoardChange }: FeedbackConfigSettingsProps) {
  const canCustomize = hasFeature(company?.subscription?.tier ?? 'free', 'canUseAdvancedFeedback');
  const initial = getFeedbackConfig(board);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [triggerStatus, setTriggerStatus] = useState<FeedbackConfig['triggerStatus']>(initial.triggerStatus);
  const [fields, setFields] = useState<FeedbackField[]>(canCustomize ? initial.fields : DEFAULT_FEEDBACK_FIELDS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (id: string, patch: Partial<FeedbackField>) => {
    setFields((prev) => prev.map((field) => (field.id === id ? { ...field, ...patch } : field)));
  };

  const changeFieldType = (id: string, type: FeedbackFieldType) => {
    setFields((prev) =>
      prev.map((field) => {
        if (field.id !== id) return field;
        const next: FeedbackField = { ...field, type };
        if (type === 'dropdown') next.options = field.options ?? ['', ''];
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
      { id: uuidv4(), type: 'text', label: '', required: false, order: prev.length },
    ]);
  };

  const handleSave = async () => {
    setError(null);

    const nextFields = canCustomize ? normalizeFeedbackFields(fields) : DEFAULT_FEEDBACK_FIELDS;
    if (enabled) {
      const validationError = validateFeedbackFields(nextFields);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    const feedbackConfig: FeedbackConfig = { enabled, triggerStatus, fields: nextFields };

    setSaving(true);
    try {
      await updateBoard(board.id, { feedbackConfig });
      onBoardChange({ ...board, feedbackConfig });
      setFields(nextFields);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save feedback settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-[var(--c-bd6cabf)] bg-[var(--c-sffffff)] p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--c-sf5e6df)] text-[var(--c-tc0694a)]">
          <MessageSquare size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-[var(--c-t1c1917)]">Post-Resolution Feedback</h2>
          <p className="mt-1 text-sm text-[var(--c-t78716c)]">
            Let submitters rate how their request was handled the next time they open their tracking page.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="flex items-start gap-3 rounded-xl border border-[var(--c-be9e0d9)] bg-[var(--c-sf5f0ec)] p-4">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            className="mt-1 h-4 w-4 accent-[var(--c-sc0694a)]"
          />
          <span>
            <span className="block text-sm font-bold text-[var(--c-t1c1917)]">Collect feedback after resolution</span>
            <span className="block text-sm text-[var(--c-t78716c)]">
              No emails are sent — the form appears on the tracking page.
            </span>
          </span>
        </label>

        {enabled && (
          <>
            <div className="max-w-xs">
              <Select
                label="Ask for feedback when a submission is"
                value={triggerStatus}
                onChange={(event) => setTriggerStatus(event.target.value as FeedbackConfig['triggerStatus'])}
                options={TRIGGER_STATUS_OPTIONS}
              />
            </div>

            <div className="rounded-xl border border-[var(--c-be9e0d9)] p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-[var(--c-t1c1917)]">Questions</h3>
                {!canCustomize && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--c-sf1efe8)] px-2 py-0.5 text-xs font-semibold text-[var(--c-t5f5e5a)]">
                    <Lock size={11} /> Growth+
                  </span>
                )}
              </div>

              {!canCustomize ? (
                <div className="space-y-3">
                  <ul className="space-y-2">
                    {DEFAULT_FEEDBACK_FIELDS.map((field) => (
                      <li
                        key={field.id}
                        className="flex items-center justify-between gap-3 rounded-lg bg-[var(--c-sf5f0ec)] px-3 py-2 text-sm"
                      >
                        <span className="text-[var(--c-t1c1917)]">{field.label}</span>
                        <span className="shrink-0 text-xs text-[var(--c-t78716c)]">
                          {FEEDBACK_FIELD_TYPE_LABELS[field.type]} · {field.required ? 'Required' : 'Optional'}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="rounded-xl border border-dashed border-[var(--c-bd6cabf)] bg-[var(--c-sf5f0ec)] p-4 text-sm text-[var(--c-t78716c)]">
                    Custom questions are available on Growth and Business plans.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="space-y-3 rounded-xl border border-[var(--c-be9e0d9)] bg-[var(--c-sf5f0ec)] p-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
                        <Select
                          aria-label={`Field ${index + 1} type`}
                          value={field.type}
                          onChange={(event) => changeFieldType(field.id, event.target.value as FeedbackFieldType)}
                          options={FIELD_TYPE_OPTIONS}
                        />
                        <Input
                          aria-label={`Field ${index + 1} label`}
                          value={field.label}
                          maxLength={MAX_FEEDBACK_LABEL_LENGTH}
                          placeholder="Question label"
                          onChange={(event) => updateField(field.id, { label: event.target.value })}
                        />
                      </div>

                      {field.type === 'dropdown' && (
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

                      <div className="flex items-center justify-between gap-3">
                        <label className="flex items-center gap-2 text-sm text-[var(--c-t1c1917)]">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(event) => updateField(field.id, { required: event.target.checked })}
                            className="h-4 w-4 accent-[var(--c-sc0694a)]"
                          />
                          Required
                        </label>
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

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addField}
                    disabled={fields.length >= MAX_FEEDBACK_FIELDS}
                  >
                    <Plus size={14} /> Add question
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        {error && <p className="text-sm font-semibold text-[var(--c-tc0392b)]">{error}</p>}
        <div className="flex items-center gap-3">
          <Button type="button" variant="primary" onClick={handleSave} isLoading={saving}>
            {saving ? 'Saving…' : 'Save feedback settings'}
          </Button>
          {saved && <span className="text-sm font-semibold text-[var(--c-t1d8a57)]">Saved</span>}
        </div>
      </div>
    </section>
  );
}
