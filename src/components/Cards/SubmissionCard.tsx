import { useNavigate } from 'react-router-dom';
import type { Submission } from '../../types';
import { Badge } from '../Shared';
import { formatDate } from '../../lib/utils';

interface SubmissionCardProps {
  submission: Submission;
}

export function SubmissionCard({ submission }: SubmissionCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/submission/${submission.id}`)}
      className="text-left bg-white border border-[#D3D1C7] rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#1E3A5F] mb-1">
            {submission.subject}
          </h3>
          <p className="text-sm text-[#6B7B8D]">{submission.trackingCode}</p>
        </div>
        <Badge status={submission.status} />
      </div>

      <p className="text-sm text-[#444441] mb-4 line-clamp-2">
        {submission.description}
      </p>

      <div className="flex items-center justify-between text-xs">
        <div className="flex gap-4">
          <span className="px-2 py-1 bg-[#D6EEF5] text-[#2E86AB] rounded">
            {submission.category}
          </span>
          {submission.priority && (
            <span className="px-2 py-1 bg-[#EFF3F6] text-[#6B7B8D] rounded">
              {submission.priority}
            </span>
          )}
        </div>
        <span className="text-[#6B7B8D]">
          {formatDate(submission.createdAt.toDate())}
        </span>
      </div>
    </button>
  );
}
