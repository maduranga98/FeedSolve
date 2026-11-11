import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Lock, Plus } from 'lucide-react';
import type { Board, Submission, SubmissionCustomFieldValue, SubmissionCustomFieldValueType } from '../../types';
import { Button } from '../Shared';
import { getBoard, getSubmissionTeamFields, getUser, saveSubmissionTeamFields } from '../../lib/firestore';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import {
  buildSubmissionCustomFields,
  getSubmissionConfig,
  getSubmissionFieldDisplays,
  getTeamOnlyFields,
  hasMeaningfulAnswers,
  validateSubmissionAnswers,
} from '../../lib/submission-fields';
import type { SubmissionAnswers } from '../../lib/submission-fields';
import { CustomFieldsForm } from './CustomFieldsForm';

interface SubmissionCustomFieldsProps {
  submission: Submission;
  /** Pass when the board is already loaded; otherwise it is fetched by `submission.boardId`. */
  board?: Board | null;
}

/**
 * Detail-view section for custom-field submissions: walks the board's field definitions,
 * matches each stored answer by fieldId and renders label + value. Team-only answers come
 * from the team-only subcollection. If none were saved when the submission was created
 * (e.g. it came from the public form), someone who can manage submissions may add them
 * here once; after that they are final. Renders nothing for fixed-form submissions
 * (no `customFields`), which keep the standard Description block.
 */
export function SubmissionCustomFields({ submission, board: providedBoard }: SubmissionCustomFieldsProps) {
  const { hasPermissionTo } = usePermissions();
  const { user } = useAuth();
  const isCustom = submission.customFields !== undefined;
  const [fetchedBoard, setFetchedBoard] = useState<Board | null>(null);
  const [assignee, setAssignee] = useState<{ uid: string; name: string } | null>(null);
  // Team-only answers for this submission: undefined while loading, null when none are saved.
  const [teamState, setTeamState] = useState<{
    submissionId: string;
    answers: SubmissionCustomFieldValue[] | null;
  } | null>(null);
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

  const hasTeamFields = teamFields.length > 0;

  useEffect(() => {
    if (!isCustom || !hasTeamFields) return;
    let cancelled = false;
    getSubmissionTeamFields(submission.id)
      .then((data) => {
        if (!cancelled) setTeamState({ submissionId: submission.id, answers: data?.customFields ?? null });
      })
      .catch((error) => console.error('Failed to load team-only fields:', error));
    return () => {
      cancelled = true;
    };
  }, [isCustom, hasTeamFields, submission.id]);

  const teamLoaded = teamState !== null && teamState.submissionId === submission.id;
  const teamAnswers = teamLoaded ? teamState.answers : null;

  const displays = useMemo(
    () =>
      getSubmissionFieldDisplays(board, submission, {
        assigneeName: assignee && assignee.uid === submission.assignedTo ? assignee.name : null,
        teamFields: teamAnswers ?? undefined,
      }),
    [board, submission, teamAnswers, assignee]
  );

  // One-time fill: only offered while no team answers exist. Rules reject a second write.
  const canAdd =
    isCustom &&
    hasTeamFields &&
    teamLoaded &&
    teamAnswers === null &&
    !submission.isMerged &&
    !!user &&
    hasPermissionTo('submissions:update');

  const startEditing = () => {
    setAnswers({});
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

    const next = buildSubmissionCustomFields(teamFields, answers);
    if (!hasMeaningfulAnswers(next)) {
      setErrors({ submit: 'Fill in at least one field before saving.' });
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      await saveSubmissionTeamFields(submission.id, next, user.id);
      setTeamState({ submissionId: submission.id, answers: next });
      setEditing(false);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (!isCustom || (displays.length === 0 && !canAdd)) return null;

  return (
    <div className="rounded-xl border border-[var(--c-be9e0d9)] bg-[var(--c-sfafafa)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <ClipboardList size={16} className="text-[var(--c-tc0694a)]" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--c-t8f8680)]">Submission details</h3>
        {canAdd && !editing && (
          <button
            type="button"
            onClick={startEditing}
            className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[var(--c-tc0694a)] hover:bg-[var(--c-sf5e6df)]"
          >
            <Plus size={12} />
            Add team fields
          </button>
        )}
      </div>

      {displays.length > 0 ? (
        <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
          {displays.map((item) => (
              <div key={item.id} className={item.type === 'textarea' ? 'sm:col-span-2' : undefined}>
                <dt className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-[var(--c-t8f8680)]">
                  {item.label}
                  {item.autoSource && <span className="ml-1 font-normal normal-case text-[var(--c-t9aabbf)]">(auto)</span>}
                  {item.audience === 'internal' && (
                    <span className="ml-1 inline-flex items-center gap-0.5 font-normal normal-case text-[var(--c-t9aabbf)]">
                      <Lock size={10} /> team only
                    </span>
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
        !editing && <p className="text-sm text-[var(--c-t78716c)]">No details yet.</p>
      )}

      {editing && (
        <div className="mt-4 border-t border-[var(--c-be9e0d9)] pt-4">
          <p className="mb-3 text-xs text-[var(--c-t78716c)]">
            Team-only fields, visible to your team and never to the submitter. They can be saved once and
            can't be changed afterwards, so check them before saving.
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
