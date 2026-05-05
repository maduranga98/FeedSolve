import { useState, useEffect, useCallback, memo } from 'react';
import type { Submission, User } from '../../types';
import { Badge } from '../Shared';
import { formatDate } from '../../lib/utils';
import { getUser } from '../../lib/firestore';
import { MessageSquare, UserCircle } from 'lucide-react';

interface SubmissionCardProps {
  submission: Submission;
  onClick?: (submission: Submission) => void;
  compact?: boolean;
  usersMap?: Record<string, User>;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onToggleSelect?: (id: string) => void;
}

const priorityDot: Record<string, string> = {
  low:      'bg-[#3498DB]',
  medium:   'bg-[#F39C12]',
  high:     'bg-[#E74C3C]',
  critical: 'bg-[#8B0000]',
};

const priorityLabel: Record<string, string> = {
  low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical',
};

function SubmissionCardComponent({
  submission,
  onClick,
  compact = false,
  usersMap,
  isSelected = false,
  isSelectionMode = false,
  onToggleSelect,
}: SubmissionCardProps) {
  const [fetchedUser, setFetchedUser] = useState<User | null>(null);

  const assignedUser: User | null | undefined = submission.assignedTo
    ? (usersMap ? (usersMap[submission.assignedTo] ?? null) : fetchedUser)
    : null;

  useEffect(() => {
    if (!submission.assignedTo || usersMap) return;
    getUser(submission.assignedTo)
      .then(setFetchedUser)
      .catch(() => {});
  }, [submission.assignedTo, usersMap]);

  const handleClick = useCallback(() => {
    onClick?.(submission);
  }, [submission, onClick]);

  const handleCheckboxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      onToggleSelect?.(submission.id);
    },
    [submission.id, onToggleSelect]
  );

  const dot = priorityDot[submission.priority] || priorityDot.medium;

  return (
    <div
      onClick={handleClick}
      className={`group relative bg-white rounded-xl p-5 transition-all duration-150 border
        ${isSelected
          ? 'border-[#E8ECF0] border-l-[3px] border-l-[#2E86AB]'
          : 'border-[#E8ECF0]'
        }
        ${onClick ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : ''}
      `}
    >
      {/* Top row */}
      <div className={`flex items-start gap-3 ${compact ? 'mb-2' : 'mb-3'}`}>
        {/* Checkbox — always visible on mobile, hover-reveal on desktop (always visible in selection mode) */}
        {onToggleSelect && (
          <div
            className={`flex-shrink-0 mt-0.5 transition-opacity ${
              isSelectionMode
                ? 'opacity-100'
                : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
            }`}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 cursor-pointer accent-[#2E86AB]"
              aria-label={`Select ${submission.subject}`}
            />
          </div>
        )}

        <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-[#1E3A5F] truncate mb-0.5 ${compact ? 'text-[15px]' : 'text-sm'}`}>
              {submission.subject}
            </h3>
            <p className="text-xs text-[#9AABBF] font-mono">{submission.trackingCode}</p>
          </div>
          <Badge status={submission.status} className="flex-shrink-0" />
        </div>
      </div>

      {/* Description */}
      <p className={`text-sm text-[#6B7B8D] ${compact ? 'mb-3 line-clamp-1' : 'mb-4 line-clamp-2'} leading-relaxed`}>
        {submission.description}
      </p>

      {/* Footer row */}
      <div className={`flex items-center justify-between gap-2 flex-wrap ${compact ? 'pt-1 border-t border-[#EEF2F6]' : ''}`}>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category chip */}
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#EBF5FB] text-[#2E86AB] text-xs font-medium">
            {submission.category}
          </span>

          {/* Priority with color dot */}
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#F4F7FA] text-[#6B7B8D] text-xs font-medium">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
            {priorityLabel[submission.priority] || submission.priority}
          </span>

          {/* Assignee */}
          {assignedUser && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F0F4F8] text-[#4A6274] text-xs font-medium">
              <UserCircle size={11} />
              {assignedUser.name.split(' ')[0]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {submission.internalNotes?.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-[#9AABBF]">
              <MessageSquare size={11} />
              {submission.internalNotes.length}
            </span>
          )}
          <span className="text-xs text-[#B0BEC9]">
            {formatDate(submission.createdAt.toDate())}
          </span>
        </div>
      </div>
    </div>
  );
}

export const SubmissionCard = memo(SubmissionCardComponent);
