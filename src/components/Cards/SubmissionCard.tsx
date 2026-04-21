import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, memo } from 'react';
import type { Submission } from '../../types';
import { Badge } from '../Shared';
import { formatDate } from '../../lib/utils';
import { getUser } from '../../lib/firestore';
import type { User } from '../../types';

interface SubmissionCardProps {
  submission: Submission;
  onClick?: (submission: Submission) => void;
}

const priorityColors: Record<string, { bg: string; text: string }> = {
  low: { bg: 'bg-[#E8F4F8]', text: 'text-[#0B5563]' },
  medium: { bg: 'bg-[#FEF5E7]', text: 'text-[#854F0B]' },
  high: { bg: 'bg-[#FDE8E8]', text: 'text-[#A32D2D]' },
  critical: { bg: 'bg-[#8B0000]', text: 'text-[#FFFFFF]' },
};

function SubmissionCardComponent({ submission, onClick }: SubmissionCardProps) {
  const [assignedUser, setAssignedUser] = useState<User | null>(null);

  useEffect(() => {
    const loadAssignedUser = async () => {
      if (!submission.assignedTo) return;
      try {
        const user = await getUser(submission.assignedTo);
        setAssignedUser(user);
      } catch (error) {
        console.error('Failed to load assigned user:', error);
      }
    };

    loadAssignedUser();
  }, [submission.assignedTo]);

  const handleClick = useCallback(() => {
    onClick?.(submission);
  }, [submission, onClick]);

  const priorityStyle = priorityColors[submission.priority] || priorityColors.medium;

  return (
    <div
      onClick={handleClick}
      className={`bg-white border border-[#D3D1C7] rounded-lg p-6 transition-shadow ${
        onClick ? 'hover:shadow-md cursor-pointer' : ''
      }`}
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

      <div className="space-y-3 text-xs">
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-[#D6EEF5] text-[#2E86AB] rounded">
            {submission.category}
          </span>
          <span className={`px-2 py-1 rounded ${priorityStyle.bg} ${priorityStyle.text}`}>
            {submission.priority}
          </span>
          {assignedUser && (
            <span className="px-2 py-1 bg-[#E0E8EF] text-[#1E3A5F] rounded">
              Assigned to {assignedUser.name}
            </span>
          )}
        </div>
        <div className="flex justify-between text-[#6B7B8D]">
          <span>{formatDate(submission.createdAt.toDate())}</span>
          {submission.internalNotes.length > 0 && (
            <span className="text-[#2E86AB]">{submission.internalNotes.length} notes</span>
          )}
        </div>
      </div>
    </div>
  );
}

export const SubmissionCard = memo(SubmissionCardComponent);
