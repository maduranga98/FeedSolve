import { useEffect, useMemo, useState } from 'react';
import { Hourglass, MessageSquareHeart, Star } from 'lucide-react';
import type { Board, FeedbackResponse, Submission } from '../../types';
import { getFeedbackResponse } from '../../lib/firestore';
import { formatFeedbackValue, getFeedbackConfig } from '../../lib/feedback';
import { formatDate } from '../../lib/utils';

interface SubmissionFeedbackProps {
  submission: Submission;
  board: Board | null;
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={16}
          className={n <= value ? 'fill-[var(--c-tc0694a)] text-[var(--c-tc0694a)]' : 'text-[var(--c-t9aabbf)]'}
        />
      ))}
    </span>
  );
}

/** Whether the submission's status has reached the board's feedback trigger. */
export function isFeedbackRequested(board: Board | null, submission: Submission): boolean {
  if (!board) return false;
  const { enabled, triggerStatus } = getFeedbackConfig(board);
  if (!enabled) return false;
  return triggerStatus === 'closed'
    ? submission.status === 'closed'
    : submission.status === 'resolved' || submission.status === 'closed';
}

/** The submitter's post-resolution feedback, shown to the team on its own tab. */
export function SubmissionFeedback({ submission, board }: SubmissionFeedbackProps) {
  const config = useMemo(() => (board ? getFeedbackConfig(board) : null), [board]);
  const requested = isFeedbackRequested(board, submission);
  const [state, setState] = useState<{ code: string; response: FeedbackResponse | null } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getFeedbackResponse(submission.trackingCode)
      .then((response) => {
        if (cancelled) return;
        setError(false);
        setState({ code: submission.trackingCode, response });
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [submission.trackingCode, submission.status]);

  const loaded = state?.code === submission.trackingCode;
  const response = loaded ? state.response : null;

  if (error) {
    return <p className="text-sm text-[var(--c-tc0392b)]">Couldn't load the submitter's feedback. Please try again.</p>;
  }
  if (!loaded || !config) {
    return <p className="text-sm text-[var(--c-t8f8680)]">Loading feedback…</p>;
  }

  if (!response) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <Hourglass size={22} className="text-[var(--c-t8f8680)]" />
        <p className="text-sm font-semibold text-[var(--c-t3c3632)]">
          {requested ? 'Waiting for the submitter' : 'Feedback not requested yet'}
        </p>
        <p className="max-w-sm text-xs text-[var(--c-t78716c)]">
          {requested
            ? 'The submitter can leave feedback from their tracking page. It will appear here once they do.'
            : `The submitter is asked for feedback once this submission is ${config.triggerStatus}.`}
        </p>
      </div>
    );
  }

  const fieldsById = new Map(config.fields.map((f) => [f.id, f]));
  const answers = config.fields
    .map((field) => ({ field, answer: response.responses.find((r) => r.fieldId === field.id) }))
    .filter((row) => row.answer !== undefined);
  // Answers whose field was later removed from the board still belong to the response.
  const orphaned = response.responses.filter((r) => !fieldsById.has(r.fieldId));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <MessageSquareHeart size={16} className="text-[var(--c-tc0694a)]" />
        <h3 className="text-sm font-bold text-[var(--c-t1c1917)]">Submitter feedback</h3>
        <span className="ml-auto text-xs text-[var(--c-t8f8680)]">
          {response.submittedAt ? formatDate(response.submittedAt.toDate()) : ''}
        </span>
      </div>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
        {answers.map(({ field, answer }) => {
          const text = formatFeedbackValue(field, answer!.value);
          const wide = field.type === 'textarea' || text.length > 36;
          return (
            <div key={field.id} className={`min-w-0 ${wide ? 'sm:col-span-2' : ''}`}>
              <dt className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--c-t8f8680)]">
                {field.label}
              </dt>
              <dd className="whitespace-pre-wrap break-words text-[var(--c-t3c3632)]">
                {field.type === 'rating' && typeof answer!.value === 'number' ? (
                  <Stars value={answer!.value} />
                ) : (
                  text || '—'
                )}
              </dd>
            </div>
          );
        })}
        {orphaned.map((r) => (
          <div key={r.fieldId} className="min-w-0">
            <dt className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--c-t8f8680)]">
              Removed question
            </dt>
            <dd className="whitespace-pre-wrap break-words text-[var(--c-t3c3632)]">{String(r.value)}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 border-t border-[var(--c-be9e0d9)] pt-4 text-sm">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--c-t8f8680)]">Shared by</p>
        {response.contact?.name || response.contact?.email ? (
          <p className="break-words text-[var(--c-t3c3632)]">
            {response.contact.name}
            {response.contact.name && response.contact.email && ' · '}
            {response.contact.email && (
              <a href={`mailto:${response.contact.email}`} className="underline">
                {response.contact.email}
              </a>
            )}
          </p>
        ) : (
          <p className="text-[var(--c-t8f8680)]">Anonymous</p>
        )}
      </div>
    </div>
  );
}
