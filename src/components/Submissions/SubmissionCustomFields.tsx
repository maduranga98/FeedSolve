import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, ClipboardList, Lock, Plus } from 'lucide-react';
import type { Board, Submission, SubmissionCustomFieldValue, SubmissionCustomFieldValueType } from '../../types';
import { Button } from '../Shared';
import {
  addAuditLog,
  getBoard,
  getSubmissionTeamFields,
  getUser,
  saveSubmissionTeamFields,
  updateSubmissionResolutionFields,
} from '../../lib/firestore';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import {
  answersFromEntries,
  areAnswersEqual,
  buildSubmissionCustomFields,
  getSubmissionConfig,
  formatCustomFieldValue,
  getResolutionFields,
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
  /** Render only the form answers and resolution fields ('details'), only the team-only fields ('team'), or all. */
  section?: 'details' | 'team' | 'all';
  /** Called after resolution answers are saved, so the parent can refresh its copy of the submission. */
  onUpdated?: () => void;
}

/** Long or multi-line values get a full-width row so they never get squeezed into a half column. */
function isWideValue(type: string, value: string) {
  return type === 'textarea' || value.length > 36 || value.includes('\n');
}

/**
 * Detail-view sections for a board's custom fields.
 *
 * "Submission details" maps the answers stored on the submission to the board's field
 * definitions (by fieldId); it only appears for submissions created through the custom form.
 *
 * "Resolution" lists the board's resolution-phase fields as editable inputs, pre-filled with any
 * saved answer and shown even while empty so they read as open tasks. They are saved to the same
 * `customFields` array as the intake answers, through the same direct-update path as status and
 * notes (see updateSubmissionResolutionFields). Intake answers above stay read-only. Anyone who
 * can update submissions may edit; everyone else sees the values read-only.
 *
 * "Team-only fields" appears on every submission of a board that defines team-only fields,
 * whichever form created it. Each field is listed even while unanswered. Answers come from
 * the team-only subcollection; when none exist, someone who can manage submissions may add
 * them once, after which they are final.
 */
export function SubmissionCustomFields({
  submission,
  board: providedBoard,
  section = 'all',
  onUpdated,
}: SubmissionCustomFieldsProps) {
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
  const [teamLoadError, setTeamLoadError] = useState<string | null>(null);
  // Resolution answers. `draft` holds unsaved edits; `savedOverride` holds what this view last
  // saved, and only applies while the submission prop still carries the array it was based on,
  // so a refreshed submission from the parent always wins.
  const [draft, setDraft] = useState<{ submissionId: string; answers: SubmissionAnswers } | null>(null);
  const [savedOverride, setSavedOverride] = useState<{
    submissionId: string;
    base: SubmissionCustomFieldValue[] | undefined;
    entries: SubmissionCustomFieldValue[];
  } | null>(null);
  const [resolutionErrors, setResolutionErrors] = useState<Record<string, string>>({});
  const [resolutionSaving, setResolutionSaving] = useState(false);

  const board = providedBoard ?? fetchedBoard;

  useEffect(() => {
    if (providedBoard) return;
    let cancelled = false;
    getBoard(submission.boardId)
      .then((data) => {
        if (!cancelled) setFetchedBoard(data);
      })
      .catch((error) => console.error('Failed to load board for custom fields:', error));
    return () => {
      cancelled = true;
    };
  }, [providedBoard, submission.boardId]);

  const config = useMemo(() => getSubmissionConfig(board), [board]);
  const fields = config.fields;
  // Team-only fields apply to the whole board once custom fields are switched on.
  const teamFields = useMemo(
    () => (config.useCustomFields && section !== 'details' ? getTeamOnlyFields(config.fields) : []),
    [config, section]
  );
  // Resolution fields apply to every submission of a board with custom fields switched on,
  // like team-only fields, whichever form created it.
  const resolutionFields = useMemo(
    () => (config.useCustomFields && section !== 'team' ? getResolutionFields(config.fields) : []),
    [config, section]
  );
  const hasResolutionFields = resolutionFields.length > 0;
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
    if (!hasTeamFields) return;
    let cancelled = false;
    getSubmissionTeamFields(submission.id)
      .then((data) => {
        if (cancelled) return;
        setTeamLoadError(null);
        setTeamState({ submissionId: submission.id, answers: data?.customFields ?? null });
      })
      .catch((error) => {
        console.error('Failed to load team-only fields:', error);
        if (!cancelled) setTeamLoadError(error instanceof Error ? error.message : 'Unknown error');
      });
    return () => {
      cancelled = true;
    };
  }, [hasTeamFields, submission.id]);

  const teamLoaded = teamState !== null && teamState.submissionId === submission.id;
  const teamAnswers = teamLoaded ? teamState.answers : null;

  // Answers on the submission document. Team-only fields are rendered in their own section.
  // Resolution-phase answers are editable, so they are rendered in their own section below.
  const displays = useMemo(
    () =>
      getSubmissionFieldDisplays(board, submission, {
        assigneeName: assignee && assignee.uid === submission.assignedTo ? assignee.name : null,
      }).filter((item) => item.audience !== 'internal' && item.phase !== 'resolution'),
    [board, submission, assignee]
  );

  const savedResolutionEntries =
    savedOverride && savedOverride.submissionId === submission.id && savedOverride.base === submission.customFields
      ? savedOverride.entries
      : submission.customFields;
  const savedResolutionAnswers = useMemo(
    () => answersFromEntries(resolutionFields, savedResolutionEntries),
    [resolutionFields, savedResolutionEntries]
  );
  const resolutionAnswers = draft && draft.submissionId === submission.id ? draft.answers : savedResolutionAnswers;
  const resolutionDirty = !areAnswersEqual(resolutionFields, resolutionAnswers, savedResolutionAnswers);
  const canEditResolution =
    hasResolutionFields && !submission.isMerged && !!user && hasPermissionTo('submissions:update');

  const resolutionRows = useMemo(
    () =>
      resolutionFields.map((field) => ({
        id: field.id,
        label: field.label,
        type: field.type,
        value: formatCustomFieldValue(
          field,
          (savedResolutionEntries ?? []).find((entry) => entry.fieldId === field.id)?.value
        ),
      })),
    [resolutionFields, savedResolutionEntries]
  );

  // Every team-only field, answered or not, so the team can see what is still missing.
  const teamRows = useMemo(() => {
    const valuesById = new Map(
      [...(submission.customFields ?? []), ...(teamAnswers ?? [])].map((entry) => [entry.fieldId, entry.value])
    );
    return teamFields.map((field) => ({
      id: field.id,
      label: field.label,
      type: field.type,
      value: formatCustomFieldValue(field, valuesById.get(field.id)),
    }));
  }, [teamFields, teamAnswers, submission.customFields]);

  // One-time fill: only offered while no team answers exist. Rules reject a second write.
  const canAdd =
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

  const handleResolutionChange = (fieldId: string, value: SubmissionCustomFieldValueType) => {
    setDraft({ submissionId: submission.id, answers: { ...resolutionAnswers, [fieldId]: value } });
    setResolutionErrors((prev) => {
      if (!prev[fieldId] && !prev.submit) return prev;
      const rest = { ...prev };
      delete rest[fieldId];
      delete rest.submit;
      return rest;
    });
  };

  const handleResolutionSave = async () => {
    if (!user || resolutionSaving || !resolutionDirty) return;

    const validationErrors = validateSubmissionAnswers(resolutionFields, resolutionAnswers);
    if (Object.keys(validationErrors).length > 0) {
      setResolutionErrors(validationErrors);
      return;
    }

    setResolutionSaving(true);
    try {
      const entries = await updateSubmissionResolutionFields(submission.id, resolutionFields, resolutionAnswers);
      setSavedOverride({ submissionId: submission.id, base: submission.customFields, entries });
      setDraft(null);
      setResolutionErrors({});
      void addAuditLog(user.companyId, {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: 'Updated resolution fields',
        resourceType: 'submission',
        resourceId: submission.id,
        resourceName: submission.subject,
        details: { fields: resolutionFields.map((field) => field.label) },
      });
      onUpdated?.();
    } catch (error) {
      console.error('Failed to update resolution fields:', error);
      setResolutionErrors({
        submit: error instanceof Error ? error.message : 'Failed to save. Please try again.',
      });
    } finally {
      setResolutionSaving(false);
    }
  };

  const showDetails = section !== 'team' && isCustom && displays.length > 0;
  if (!showDetails && !hasTeamFields && !hasResolutionFields) return null;

  return (
    <div className="space-y-4">
      {showDetails && (
        <div className="rounded-xl border border-[var(--c-be9e0d9)] bg-[var(--c-sffffff)] p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList size={16} className="text-[var(--c-tc0694a)]" />
            <h3 className="text-sm font-bold text-[var(--c-t1c1917)]">Form responses</h3>
            <span className="ml-auto text-xs text-[var(--c-t8f8680)]">{displays.length} fields</span>
          </div>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
            {displays.map((item) => (
              <div
                key={item.id}
                className={`min-w-0 ${isWideValue(item.type, item.value) ? 'sm:col-span-2' : ''}`}
              >
                <dt className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--c-t8f8680)]">
                  {item.label}
                  {item.autoSource && <span className="ml-1 font-normal normal-case text-[var(--c-t9aabbf)]">(auto)</span>}
                  {item.removed && (
                    <span className="ml-1 font-normal normal-case text-[var(--c-t9aabbf)]">(no longer in form)</span>
                  )}
                </dt>
                <dd className="whitespace-pre-wrap break-words text-[var(--c-t3c3632)]">{item.value || '—'}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {hasResolutionFields && (
        <div className="rounded-xl border border-[var(--c-be9e0d9)] bg-[var(--c-sffffff)] p-4 sm:p-5">
          <div className="mb-1 flex items-center gap-2">
            <ClipboardCheck size={16} className="text-[var(--c-tc0694a)]" />
            <h3 className="text-sm font-bold text-[var(--c-t1c1917)]">Resolution</h3>
          </div>
          <p className="mb-4 text-xs text-[var(--c-t78716c)]">
            {canEditResolution
              ? 'Filled in by your team while working on this submission. Empty fields are still to do.'
              : 'Filled in by your team while working on this submission.'}
          </p>

          {canEditResolution ? (
            <>
              <CustomFieldsForm
                fields={resolutionFields}
                answers={resolutionAnswers}
                errors={resolutionErrors}
                onChange={handleResolutionChange}
                disabled={resolutionSaving}
                idPrefix={`resolution-field-${submission.id}`}
              />
              {resolutionErrors.submit && (
                <p className="mt-3 text-sm font-semibold text-[var(--c-tc0392b)]">{resolutionErrors.submit}</p>
              )}
              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setDraft(null);
                    setResolutionErrors({});
                  }}
                  disabled={resolutionSaving || !resolutionDirty}
                >
                  Discard
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleResolutionSave}
                  isLoading={resolutionSaving}
                  disabled={!resolutionDirty}
                >
                  {resolutionSaving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </>
          ) : (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              {resolutionRows.map((row) => (
                <div key={row.id} className={`min-w-0 ${isWideValue(row.type, row.value) ? 'sm:col-span-2' : ''}`}>
                  <dt className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--c-t8f8680)]">
                    {row.label}
                  </dt>
                  <dd className="whitespace-pre-wrap break-words text-[var(--c-t3c3632)]">
                    {row.value || <span className="text-[var(--c-t9aabbf)]">Not filled in</span>}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      {hasTeamFields && (
        <div className="rounded-xl border border-[var(--c-be9e0d9)] bg-[var(--c-sfaf8f5)] p-4 sm:p-5">
          <div className="mb-1 flex items-center gap-2">
            <Lock size={15} className="text-[var(--c-tc0694a)]" />
            <h3 className="text-sm font-bold text-[var(--c-t1c1917)]">Team-only fields</h3>
            {canAdd && !editing && (
              <Button type="button" variant="primary" size="sm" className="ml-auto" onClick={startEditing}>
                <Plus size={13} />
                Fill in
              </Button>
            )}
          </div>
          <p className="mb-3 text-xs text-[var(--c-t78716c)]">
            {teamAnswers
              ? 'Visible to your team only. These answers are final.'
              : 'Visible to your team only. They can be saved once and not changed afterwards.'}
          </p>

          {teamLoadError && (
            <p className="mb-3 rounded-lg border border-[var(--c-bfca5a5)] bg-[var(--c-sfff5f5)] p-3 text-sm text-[var(--c-tc0392b)]">
              Couldn't load the team-only answers ({teamLoadError}). If this feature was just released, the
              updated Firestore security rules may not be deployed yet.
            </p>
          )}

          {!editing && (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              {teamRows.map((row) => (
                <div key={row.id} className={`min-w-0 ${isWideValue(row.type, row.value) ? 'sm:col-span-2' : ''}`}>
                  <dt className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--c-t8f8680)]">
                    {row.label}
                  </dt>
                  <dd className="whitespace-pre-wrap break-words text-[var(--c-t3c3632)]">
                    {row.value || <span className="text-[var(--c-t9aabbf)]">Not filled in</span>}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {editing && (
            <>
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
                  Save (final)
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
