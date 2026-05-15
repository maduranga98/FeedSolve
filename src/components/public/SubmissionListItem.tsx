import { ChevronRight } from "lucide-react";
import type { Timestamp } from "firebase/firestore";
import { Badge } from "../Shared";
import { formatDate } from "../../lib/utils";
import type { Submission } from "../../types";

export interface PublicSubmissionSummary {
  submission: Submission;
  boardName: string;
  companyId: string;
  companyName: string;
}

interface SubmissionListItemProps {
  item: PublicSubmissionSummary;
  onClick: () => void;
}

function formatSubmissionDate(createdAt: Timestamp) {
  return formatDate(createdAt.toDate());
}

export function SubmissionListItem({ item, onClick }: SubmissionListItemProps) {
  const { submission, boardName } = item;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-[#D3D1C7] bg-white p-4 text-left shadow-sm transition hover:border-[#2E86AB] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/30"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-[#1E3A5F]">
              {submission.trackingCode}
            </span>
            <Badge status={submission.status} className="px-2 py-0.5 text-xs" />
          </div>
          <div className="grid gap-1 text-sm text-[#6B7B8D] sm:grid-cols-2">
            <p className="truncate">
              <span className="font-medium text-[#1E3A5F]">Board:</span> {boardName}
            </p>
            <p className="truncate">
              <span className="font-medium text-[#1E3A5F]">Category:</span> {submission.category}
            </p>
          </div>
          <p className="text-xs text-[#6B7B8D]">Submitted {formatSubmissionDate(submission.createdAt)}</p>
        </div>
        <ChevronRight size={18} className="mt-1 flex-shrink-0 text-[#6B7B8D]" />
      </div>
    </button>
  );
}
