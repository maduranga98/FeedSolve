import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import type { Board } from '../../types';
import { Button } from '../Shared';
import { updateBoard } from '../../lib/firestore';
import {
  buildSubmissionConfig,
  getSubmissionConfig,
  normalizeSubmissionFields,
  validateSubmissionFields,
} from '../../lib/submission-fields';
import { SubmissionFieldsEditor } from './SubmissionFieldsEditor';
import type { SubmissionFormDraft } from './SubmissionFieldsEditor';

interface SubmissionFieldsSettingsProps {
  board: Board;
  onBoardChange: (board: Board) => void;
}

export function SubmissionFieldsSettings({ board, onBoardChange }: SubmissionFieldsSettingsProps) {
  const initial = getSubmissionConfig(board);
  const [draft, setDraft] = useState<SubmissionFormDraft>({
    useCustomFields: initial.useCustomFields,
    appliesTo: initial.appliesTo,
    fields: initial.fields,
    showCategorySelector: initial.showCategorySelector !== false,
    allowAttachments: initial.allowAttachments !== false,
    showTrackingCodeToSubmitter: initial.showTrackingCodeToSubmitter !== false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);

    const normalized = normalizeSubmissionFields(draft.fields);
    if (draft.useCustomFields) {
      const validationError = validateSubmissionFields(normalized, draft.appliesTo);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    const submissionConfig = buildSubmissionConfig(draft.useCustomFields, draft.appliesTo, normalized, {
      showCategorySelector: draft.showCategorySelector,
      allowAttachments: draft.allowAttachments,
      showTrackingCodeToSubmitter: draft.showTrackingCodeToSubmitter,
    });

    setSaving(true);
    try {
      await updateBoard(board.id, { submissionConfig });
      onBoardChange({ ...board, submissionConfig });
      setDraft((prev) => ({ ...prev, fields: submissionConfig.fields }));
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
            cause or checklists, and choose which standard form elements people see.
          </p>
        </div>
      </div>

      <SubmissionFieldsEditor value={draft} onChange={setDraft} />

      <div className="mt-4 space-y-4">
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
