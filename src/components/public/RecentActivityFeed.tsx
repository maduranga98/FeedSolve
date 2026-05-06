import type { Submission } from '../../types';

type RecentActivityFeedProps = {
  submissions: Submission[];
  formatResolutionTime: (submission: Submission) => string;
};

export function RecentActivityFeed({ submissions, formatResolutionTime }: RecentActivityFeedProps) {
  if (submissions.length === 0) {
    return (
      <div className="rounded-xl border border-[#D3D1C7] bg-white p-6 text-center text-sm text-[#6B7B8D]">
        No resolved activity is available yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#D3D1C7] bg-white p-5 shadow-sm">
      <div className="mb-5 rounded-lg bg-[#F1F5F8] px-4 py-3 text-sm text-[#6B7B8D]">
        Activity is anonymized. FeedSolve shows only category and resolution time — never names, emails,
        subjects, or descriptions.
      </div>
      <ol className="space-y-4">
        {submissions.map((submission) => (
          <li key={submission.id} className="relative flex gap-3">
            <span className="mt-1 h-3 w-3 flex-none rounded-full bg-[#27AE60] ring-4 ring-[#EBF9F1]" />
            <div className="min-w-0 flex-1 border-b border-[#EEF2F5] pb-4 last:border-b-0 last:pb-0">
              <p className="font-medium text-[#1E3A5F]">
                {submission.category || 'General'} submission — Resolved in {formatResolutionTime(submission)}
              </p>
              <p className="mt-1 text-xs uppercase tracking-wide text-[#6B7B8D]">Anonymized public update</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
