import type { Submission } from '../../types';

type RecentActivityFeedProps = {
  submissions: Submission[];
  formatResolutionTime: (submission: Submission) => string;
};

export function RecentActivityFeed({ submissions, formatResolutionTime }: RecentActivityFeedProps) {
  if (submissions.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--c-bd6cabf)] bg-[var(--c-sffffff)] p-6 text-center text-sm text-[var(--c-t78716c)]">
        No resolved activity is available yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--c-bd6cabf)] bg-[var(--c-sffffff)] p-5 shadow-sm">
      <div className="mb-5 rounded-lg bg-[var(--c-sf5f0ec)] px-4 py-3 text-sm text-[var(--c-t78716c)]">
        Activity is anonymized. FeedSolve shows only category and resolution time — never names, emails,
        subjects, or descriptions.
      </div>
      <ol className="space-y-4">
        {submissions.map((submission) => (
          <li key={submission.id} className="relative flex gap-3">
            <span className="mt-1 h-3 w-3 flex-none rounded-full bg-[var(--c-s27ae60)] ring-4 ring-[var(--c-bebf9f1)]" />
            <div className="min-w-0 flex-1 border-b border-[var(--c-beef2f5)] pb-4 last:border-b-0 last:pb-0">
              <p className="font-medium text-[var(--c-t1c1917)]">
                {submission.category || 'General'} submission — Resolved in {formatResolutionTime(submission)}
              </p>
              <p className="mt-1 text-xs uppercase tracking-wide text-[var(--c-t78716c)]">Anonymized public update</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
