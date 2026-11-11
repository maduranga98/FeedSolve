import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Pencil } from 'lucide-react';
import type { Board, Submission, SubmissionCustomFieldValue, SubmissionCustomFieldValueType } from '../../types';
import { Button } from '../Shared';
import { getBoard, getUser, updateSubmissionCustomFields } from '../../lib/firestore';
import { usePermissions } from '../../hooks/usePermissions';
import {
  deriveSubmissionSummary,
  getSubmissionConfig,
  getSubmissionFieldDisplays,
  getTeamOnlyFields,
  mergeCustomFieldEdits,
  validateSubmissionAnswers,
} from '../../lib/submission-fields';
import type { SubmissionAnswers } from '../../lib/submission-fields';
import { CustomFieldsForm } from './CustomFieldsForm';

interface SubmissionCustomFieldsProps {
  submission: Submission;
  /** Pass when the board is already loaded; otherwise it is fetched by `submission.boardId`. */
  board?: Board | null;
  /** Called after team-only answers are saved so the parent can refresh. */
  onUpdated?: () => void;
}

/**
 * Detail-view section for custom-field submissions: walks the board's field definitions,
 * matches each stored answer by fieldId and renders label + value. Team-only fields can be
 * filled in or corrected here by anyone allowed to manage submissions, which is how a
 * public submission gets its internal details. Renders nothing for fixed-form submissions
 * (no `customFields`), which keep the standard Description block.
 */
export function SubmissionCustomFields({ submission, board: providedBoard, onUpdated }: SubmissionCustomFieldsProps) {
  const { hasPermissionTo } = usePermissions();
  const isCustom = submission.customFields !== undefined;
  const [fetchedBoard, setFetchedBoard] = useState<Board | null>(null);
  const [assignee, setAssignee] = useState<{ uid: string; name: string } | null>(null);
  // Answers saved from this view, shown until the parent re-renders with fresh data.
  const [saved, setSaved] = useState<{ submissionId: string; customFields: SubmissionCustomFieldValue[] } | null>(null);
  const [editing, setEditing] = useState(false);
  const [answers, setAnswers] = useState<SubmissionAnswers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const board = providedBoard ?? fetchedBoard;

  useEffect(() => {
    if (!isCustom || providedBoard) return;
    let cancelled = false;
    getBoard(submission.boardId)
      .then((data) => {
        if (!cancelled) setFetchedBoard(data);
      })
      .catch((error) => console.error('Failed to load board for custom fields:', error));
    return () => {
      cancelled = true;
    };
  }, [isCustom, providedBoard, submission.boardId]);

  const fields = useMemo(() => getSubmissionConfig(board).fields, [board]);
  const teamFields = useMemo(() => getTeamOnlyFields(fields), [fields]);
  const needsAssignee = fields.some((field) => field.autoSource === 'assignedTo');

  useEffect(() => {
    const uid = submission.assignedTo;
    if (!isCustom || !needsAssignee || !uid) return;
    let cancelled = false;
    getUser(uid)
      .then((data) => {
        if (!cancelled && data) setAssignee({ uid, name: data.name });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isCustom, needsAssignee, submission.assignedTo]);

  const currentFields = useMemo(
    () => (saved && saved.submissionId === submission.id ? saved.customFields : submission.customFields ?? []),
    [saved, submission.id, submission.customFields]
  );

  const displays = useMemo(
    () =>
      getSubmissionFieldDisplays(
        board,
        { ...submission, customFields: currentFields },
        { assigneeName: assignee && assignee.uid === submission.assignedTo ? assignee.name : null }
      ),
    [board, submission, currentFields, assignee]
  );

  const canEdit =
    isCustom && teamFields.length > 0 && !submission.isMerged && hasPermissionTo('submissions:update');

  const startEditing = () => {
    const valuesById = new Map(currentFields.map((entry) => [entry.fieldId, entry.value]));
    const initial: SubmissionAnswers = {};
    for (const field of teamFields) initial[field.id] = valuesById.get(field.id);
    setAnswers(initial);
    setErrors({});
    setEditing(true);
  };

  const handleChange = (fieldId: string, value: SubmissionCustomFieldValueType) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => {
      if (!prev[fieldId]) return prev;
      const rest = { ...prev };
      delete rest[fieldId];
      return rest;
    });
  };

  const handleSave = async () => {
    const validationErrors = validateSubmissionAnswers(teamFields, answers);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const next = mergeCustomFieldEdits(currentFields, teamFields, answers);
    setSaving(true);
    try {
      await updateSubmissionCustomFields(
        submission.id,
        next,
        deriveSubmissionSummary(fields, next, submission.trackingCode).description
      );
      setSaved({ submissionId: submission.id, customFields: next });
      setEditing(false);
      onUpdated?.();
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (!isCustom || (displays.length === 0 && !canEdit)) return null;

  return (
    <div className="rounded-xl border border-[var(--c-be9e0d9)] bg-[var(--c-sfafafa)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <ClipboardList size={16} className="text-[var(--c-tc0694a)]" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--c-t8f8680)]">Submission details</h3>
        {canEdit && !editing && (
          <button
            type="button"
            onClick={startEditing}
            className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[var(--c-tc0694a)] hover:bg-[var(--c-sf5e6df)]"
          >
            <Pencil size={12} />
            Edit team fields
          </button>
        )}
      </div>

      {displays.length > 0 ? (
        <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
          {displays
            .filter((item) => !(editing && item.audience === 'internal'))
            .map((item) => (
              <div key={item.id} className={item.type === 'textarea' ? 'sm:col-span-2' : undefined}>
                <dt className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-[var(--c-t8f8680)]">
                  {item.label}
                  {item.autoSource && <span className="ml-1 font-normal normal-case text-[var(--c-t9aabbf)]">(auto)</span>}
                  {item.audience === 'internal' && (
                    <span className="ml-1 font-normal normal-case text-[var(--c-t9aabbf)]">(team only)</span>
                  )}
                  {item.removed && (
                    <span className="ml-1 font-normal normal-case text-[var(--c-t9aabbf)]">(no longer in form)</span>
                  )}
                </dt>
                <dd className="whitespace-pre-wrap break-words text-[var(--c-t3c3632)]">{item.value}</dd>
              </div>
            ))}
        </dl>
      ) : (
        !editing && <p className="text-sm text-[var(--c-t78716c)]">No details yet. Add the team fields.</p>
      )}

      {editing && (
        <div className="mt-4 border-t border-[var(--c-be9e0d9)] pt-4">
          <p className="mb-3 text-xs text-[var(--c-t78716c)]">
            Team-only fields. The submitter was never asked these and does not see them on the tracking page.
          </p>
          <CustomFieldsForm
            fields={teamFields}
            answers={answers}
            errors={errors}
            onChange={handleChange}
            disabled={saving}
            idPrefix={`team-field-${submission.id}`}
          />
          {errors.submit && <p className="mt-3 text-sm font-semibold text-[var(--c-tc0392b)]">{errors.submit}</p>}
          <div className="mt-4 flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={handleSave} isLoading={saving}>
              Save team fields
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
