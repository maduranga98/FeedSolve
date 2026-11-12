import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Copy, Check, CheckCircle2, PenLine } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { createSubmission, addAuditLog } from '../../lib/firestore';
import { getAppOrigin } from '../../lib/app-url';
import { getCategoryLabel } from '../../lib/utils';
import {
  SUBJECT_MAX,
  DESCRIPTION_MAX,
  EMAIL_PATTERN,
  validateSubmissionCategory,
  validateSubmissionContent,
} from '../../lib/submission-validation';
import {
  buildSubmissionCustomFields,
  deriveSubmissionSummary,
  getFormElementToggles,
  getInputFields,
  getSubmissionConfig,
  hasMeaningfulAnswers,
  isCustomFormActive,
  splitTeamAnswers,
  validateSubmissionAnswers,
} from '../../lib/submission-fields';
import type { SubmissionAnswers } from '../../lib/submission-fields';
import { canUseSubmissionFields } from '../../lib/tier-limits';
import { CustomFieldsForm } from './CustomFieldsForm';
import { Button, Input, Select } from '../Shared';
import type { Board, SubmissionFormInput } from '../../types';

export interface CreatedSubmission {
  submissionId: string;
  trackingCode: string;
  boardId: string;
}

interface AddSubmissionModalProps {
  boards: Board[];
  /** Board preselected when the modal opens. Falls back to the first board. */
  defaultBoardId?: string;
  onClose: () => void;
  onCreated: (created: CreatedSubmission) => void;
}

const emptyForm = (category: string): SubmissionFormInput => ({
  category,
  subject: '',
  description: '',
  email: '',
  submitterName: '',
  submitterMobile: '',
  isAnonymous: false,
  location: null,
});

/**
 * Lets a team member log a submission received by phone, email or in person.
 * Writes through the same `createSubmission` path as the public form, so the
 * tracking code, default status and board counters behave identically.
 */
export function AddSubmissionModal({
  boards,
  defaultBoardId,
  onClose,
  onCreated,
}: AddSubmissionModalProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const initialBoard = boards.find((b) => b.id === defaultBoardId) ?? boards[0] ?? null;
  const [boardId, setBoardId] = useState(initialBoard?.id ?? '');
  const [formData, setFormData] = useState<SubmissionFormInput>(
    emptyForm(initialBoard?.categories[0] ?? '')
  );
  const [customAnswers, setCustomAnswers] = useState<SubmissionAnswers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedSubmission | null>(null);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const board = useMemo(() => boards.find((b) => b.id === boardId) ?? null, [boards, boardId]);

  // The board's custom fields replace Subject/Description when enabled for the internal form
  // and the plan allows it. Category stays either way. Until the plan loads the fixed form
  // is shown and submitting is held (see the submit button) so the form never switches mid-entry.
  const { subscription, loading: planLoading } = useSubscription();
  const customActive = isCustomFormActive(board, 'internal', canUseSubmissionFields(subscription));
  const customFieldDefs = useMemo(() => getInputFields(getSubmissionConfig(board).fields, 'internal'), [board]);
  // Default form elements the board owner can switch off. With the category selector hidden the
  // form keeps its preselected first category: the schema (and the rules) still require one.
  const { showCategorySelector, showTrackingCodeToSubmitter } = getFormElementToggles(board);

  const handleBoardChange = (nextBoardId: string) => {
    const nextBoard = boards.find((b) => b.id === nextBoardId);
    setBoardId(nextBoardId);
    setFormData((prev) => ({ ...prev, category: nextBoard?.categories[0] ?? '' }));
    setCustomAnswers({});
    setErrors({});
  };

  const validate = (): boolean => {
    const next = customActive
      ? {
          ...(showCategorySelector ? validateSubmissionCategory(formData.category, board, t) : {}),
          ...validateSubmissionAnswers(customFieldDefs, customAnswers),
        }
      : validateSubmissionContent(formData, board, t, showCategorySelector);
    const email = formData.email?.trim();
    if (email && !EMAIL_PATTERN.test(email)) {
      next.email = t('forms:validation.email');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || planLoading || !board || !user || !validate()) return;

    // Contact details are optional here: the caller may not want to leave any.
    const hasContact = Boolean(
      formData.email?.trim() || formData.submitterName?.trim() || formData.submitterMobile?.trim()
    );

    setSubmitting(true);
    try {
      // Custom-field submissions send answers only; createSubmission derives subject/description.
      // Team-only answers are split off into the team-only subcollection so they never sit
      // on the submission document, which is readable with a tracking code.
      const split = customActive
        ? splitTeamAnswers(customFieldDefs, buildSubmissionCustomFields(customFieldDefs, customAnswers))
        : undefined;
      const customFields = split?.shared;
      const teamFields = split && hasMeaningfulAnswers(split.team) ? split.team : undefined;

      const result = await createSubmission(
        board.id,
        board.companyId,
        {
          ...formData,
          subject: customFields ? '' : formData.subject.trim(),
          description: customFields ? '' : formData.description.trim(),
          ...(customFields ? { customFields } : {}),
          ...(teamFields ? { teamFields } : {}),
          isAnonymous: !hasContact,
          submissionLanguage: i18n.language,
        },
        { source: 'internal', createdBy: user.id }
      );

      // Audit logging must never turn a successful create into a visible failure.
      addAuditLog(user.companyId, {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: `Logged internal submission ${result.trackingCode}`,
        resourceType: 'submission',
        resourceId: result.submissionId,
        resourceName: customFields
          ? deriveSubmissionSummary(customFieldDefs, customFields, result.trackingCode).subject
          : formData.subject.trim(),
        details: { boardId: board.id, source: 'internal' },
      }).catch((err) => console.error('Failed to write audit log:', err));

      if (!result.teamFieldsSaved) {
        setErrors({ teamFields: t('forms:internal_submission.team_fields_failed', {
          defaultValue: "The submission was created, but the team-only fields couldn't be saved. Open the submission to add them.",
        }) });
      }

      const createdSubmission = {
        submissionId: result.submissionId,
        trackingCode: result.trackingCode,
        boardId: board.id,
      };
      setCreated(createdSubmission);
      onCreated(createdSubmission);
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : t('errors:something_went_wrong'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const trackingUrl = created
    ? `${getAppOrigin()}/track/${created.trackingCode.replace(/^#/, '')}`
    : '';

  const copy = async (kind: 'code' | 'link') => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(kind === 'code' ? created.trackingCode : trackingUrl);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleAddAnother = () => {
    setCreated(null);
    setErrors({});
    setCopied(null);
    setFormData(emptyForm(board?.categories[0] ?? ''));
    setCustomAnswers({});
  };

  const categoryOptions = (board?.categories ?? []).map((cat) => ({
    value: cat,
    label: board?.categoryTranslationsEnabled
      ? getCategoryLabel(cat, i18n.language, board.categoryTranslations)
      : cat,
  }));

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-submission-title"
    >
      <div className="bg-[var(--c-sffffff)] rounded-xl max-w-lg w-full shadow-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--c-be9e0d9)] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[var(--c-sf5e6df)] rounded-lg flex items-center justify-center">
              <PenLine size={15} className="text-[var(--c-tc0694a)]" />
            </div>
            <h2 id="add-submission-title" className="text-lg font-semibold text-[var(--c-t1c1917)]">
              {t('forms:internal_submission.title')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common:close', { defaultValue: 'Close' })}
            className="text-[var(--c-t8f8680)] hover:text-[var(--c-t1c1917)]"
          >
            <X size={20} />
          </button>
        </div>

        {created ? (
          <div className="p-6 space-y-5 overflow-y-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--c-seaf9f2)] flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={24} className="text-[var(--c-t1d8a57)]" />
              </div>
              <h3 className="text-base font-semibold text-[var(--c-t1c1917)]">
                {showTrackingCodeToSubmitter
                  ? t('forms:internal_submission.created')
                  : t('forms:feedback.submission_received', { defaultValue: 'Submission received' })}
              </h3>
              {showTrackingCodeToSubmitter && (
                <p className="text-sm text-[var(--c-t78716c)] mt-1">
                  {t('forms:internal_submission.share_hint')}
                </p>
              )}
            </div>

            {errors.teamFields && (
              <div className="p-3 bg-[var(--c-sfff5f5)] border border-[var(--c-bfca5a5)] rounded-lg">
                <p className="text-sm text-[var(--c-tc0392b)]">{errors.teamFields}</p>
              </div>
            )}

            {showTrackingCodeToSubmitter && (
              <>
            <div className="rounded-xl border border-[var(--c-becd3c6)] bg-[var(--c-sf5e6df)] p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--c-tc0694a)] mb-2">
                {t('forms:feedback.tracking_code')}
              </p>
              <code className="text-2xl font-mono font-black tracking-widest text-[var(--c-t1c1917)] break-all">
                {created.trackingCode}
              </code>
            </div>

            <div>
              <p className="text-sm font-medium text-[var(--c-t1c1917)] mb-1.5">
                {t('forms:internal_submission.tracking_link')}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={trackingUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-lg border border-[var(--c-bd6cabf)] bg-[var(--c-sfaf8f5)] px-3 py-2 text-sm text-[var(--c-t78716c)]"
                />
                <Button variant="secondary" size="sm" onClick={() => copy('link')} className="flex-shrink-0">
                  {copied === 'link' ? <Check size={14} /> : <Copy size={14} />}
                  {copied === 'link' ? t('forms:internal_submission.copied') : t('forms:internal_submission.copy_link')}
                </Button>
              </div>
            </div>
              </>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
              <Button variant="secondary" fullWidth onClick={handleAddAnother}>
                {t('forms:internal_submission.add_another')}
              </Button>
              {showTrackingCodeToSubmitter && (
                <Button variant="secondary" fullWidth onClick={() => copy('code')}>
                  {copied === 'code' ? <Check size={14} /> : <Copy size={14} />}
                  {copied === 'code' ? t('forms:internal_submission.copied') : t('forms:internal_submission.copy_code')}
                </Button>
              )}
              <Button variant="primary" fullWidth onClick={onClose}>
                {t('forms:internal_submission.done')}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
            <p className="text-sm text-[var(--c-t78716c)]">
              {t('forms:internal_submission.description')}
            </p>

            {errors.submit && (
              <div className="p-3 bg-[var(--c-sfff5f5)] border border-[var(--c-bfca5a5)] rounded-lg">
                <p className="text-sm text-[var(--c-tc0392b)]">{errors.submit}</p>
              </div>
            )}

            {boards.length > 1 && (
              <Select
                label={t('forms:internal_submission.board')}
                value={boardId}
                onChange={(e) => handleBoardChange(e.target.value)}
                options={boards.map((b) => ({ value: b.id, label: b.name }))}
                disabled={submitting}
              />
            )}

            {showCategorySelector && (
              <Select
                label={t('forms:feedback.category')}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                options={categoryOptions}
                error={errors.category}
                disabled={submitting}
              />
            )}

            {customActive ? (
              <CustomFieldsForm
                fields={customFieldDefs}
                answers={customAnswers}
                errors={errors}
                disabled={submitting}
                idPrefix="internal-custom-field"
                onChange={(fieldId, value) => {
                  setCustomAnswers((prev) => ({ ...prev, [fieldId]: value }));
                  setErrors((prev) => {
                    if (!prev[fieldId]) return prev;
                    const rest = { ...prev };
                    delete rest[fieldId];
                    return rest;
                  });
                }}
              />
            ) : (
              <>
            <div>
              <Input
                label={t('forms:feedback.subject')}
                placeholder={t('forms:feedback.subject_placeholder')}
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value.slice(0, SUBJECT_MAX) })
                }
                error={errors.subject}
                disabled={submitting}
              />
              <p
                className={`text-xs mt-1 text-right ${
                  formData.subject.length >= SUBJECT_MAX
                    ? 'text-[var(--c-tc0392b)]'
                    : 'text-[var(--c-t8f8680)]'
                }`}
              >
                {formData.subject.length}/{SUBJECT_MAX}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--c-t1c1917)] mb-1.5">
                {t('forms:feedback.description')}
              </label>
              <textarea
                placeholder={t('forms:feedback.description_placeholder')}
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value.slice(0, DESCRIPTION_MAX),
                  })
                }
                rows={5}
                disabled={submitting}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm resize-none bg-[var(--c-sffffff)] text-[var(--c-t1c1917)] placeholder:text-[var(--c-t8f8680)] focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-[var(--c-sf5f0ec)] ${
                  errors.description
                    ? 'border-[var(--c-bc0392b)] focus:ring-[var(--c-bc0392b)]/30'
                    : 'border-[var(--c-bd6cabf)] focus:ring-[var(--c-bc0694a)]/30 focus:border-[var(--c-bc0694a)]'
                }`}
              />
              <div className="flex items-start justify-between mt-1">
                {errors.description ? (
                  <p className="text-xs text-[var(--c-tc0392b)]">{errors.description}</p>
                ) : (
                  <span />
                )}
                <p
                  className={`text-xs ${
                    formData.description.length >= DESCRIPTION_MAX
                      ? 'text-[var(--c-tc0392b)]'
                      : 'text-[var(--c-t8f8680)]'
                  }`}
                >
                  {formData.description.length}/{DESCRIPTION_MAX}
                </p>
              </div>
            </div>
              </>
            )}

            <div className="pt-4 border-t border-[var(--c-bf2ece6)] space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--c-t1c1917)]">
                  {t('forms:internal_submission.from_section')}
                </h3>
                <p className="text-xs text-[var(--c-t8f8680)] mt-0.5">
                  {t('forms:internal_submission.from_help')}
                </p>
              </div>

              <Input
                label={t('forms:feedback.email')}
                type="email"
                placeholder="customer@email.com"
                value={formData.email ?? ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                disabled={submitting}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t('forms:feedback.name')}
                  placeholder={t('forms:feedback.name_placeholder')}
                  value={formData.submitterName ?? ''}
                  onChange={(e) => setFormData({ ...formData, submitterName: e.target.value })}
                  disabled={submitting}
                />
                <Input
                  label={t('forms:feedback.mobile')}
                  type="tel"
                  placeholder={t('forms:feedback.mobile_placeholder')}
                  value={formData.submitterMobile ?? ''}
                  onChange={(e) => setFormData({ ...formData, submitterMobile: e.target.value })}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="secondary" fullWidth onClick={onClose} disabled={submitting} type="button">
                {t('common:cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button variant="primary" fullWidth type="submit" isLoading={submitting} disabled={!board || planLoading}>
                {t('forms:internal_submission.submit')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
