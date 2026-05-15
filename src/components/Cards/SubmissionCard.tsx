import { useState, useEffect, useCallback, memo } from 'react';
import type { Submission, User } from '../../types';
import { Badge } from '../Shared';
import { formatDate } from '../../lib/utils';
import { getUser } from '../../lib/firestore';
import { MapPin, MessageSquare, UserCircle } from 'lucide-react';

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

const satisfactionEmoji: Record<number, string> = {
  1: '😠', 2: '😕', 3: '😐', 4: '😊', 5: '😄',
};

const satisfactionStyle: Record<number, string> = {
  1: 'bg-[#FEE2E2] text-[#B91C1C]',
  2: 'bg-[#FEF3C7] text-[#92400E]',
  3: 'bg-[#F1F5F9] text-[#475569]',
  4: 'bg-[#DBEAFE] text-[#1D4ED8]',
  5: 'bg-[#DCFCE7] text-[#15803D]',
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
      className={`group relative bg-white rounded-xl p-4 transition-all duration-150 border
        ${isSelected
          ? 'border-l-[3px] border-l-[#2E86AB] border-[#C8DDF0] bg-[#F8FBFD]'
          : 'border-[#E8ECF0] hover:border-[#C8DDF0]'
        }
        ${onClick ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : ''}
      `}
    >
      {/* Top row */}
      <div className={`flex items-start gap-3 ${compact ? 'mb-2' : 'mb-2.5'}`}>
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

        <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-[#1E3A5F] truncate mb-0.5 ${compact ? 'text-[15px]' : 'text-sm'}`}>
              {submission.subject}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[11px] text-[#9AABBF] font-mono">{submission.trackingCode}</p>
              {submission.isMerged && (
                <span className="rounded-full bg-[#F1EFE8] px-2 py-0.5 text-[11px] font-semibold text-[#5F5E5A]">
                  Merged
                </span>
              )}
            </div>
          </div>
          <Badge status={submission.status} className="flex-shrink-0 mt-0.5" />
        </div>
      </div>

      {/* Description */}
      <p className={`text-xs text-[#6B7B8D] leading-relaxed ${compact ? 'mb-2.5 line-clamp-1' : 'mb-3 line-clamp-2'}`}>
        {submission.description}
      </p>

      {/* Footer */}
      <div className={`flex items-center justify-between gap-x-2 gap-y-1.5 flex-wrap ${compact ? 'pt-2 border-t border-[#F0F4F8]' : ''}`}>
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#EBF5FB] text-[#2E86AB] text-[11px] font-semibold flex-shrink-0">
            {submission.category}
          </span>

          {submission.location && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EFF3F6] text-[#6B7B8D] text-[11px] font-medium flex-shrink-0">
              <MapPin size={10} />
              {submission.location}
            </span>
          )}

          {submission.satisfactionScore != null && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0 ${satisfactionStyle[submission.satisfactionScore]}`}
              title={submission.satisfactionLabel ?? undefined}
            >
              <span className="text-sm leading-none">{satisfactionEmoji[submission.satisfactionScore]}</span>
              {submission.satisfactionLabel}
            </span>
          )}

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E1E8EF] text-[#6B7B8D] text-[11px] font-medium flex-shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
            {priorityLabel[submission.priority] || submission.priority}
          </span>

          {assignedUser && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F0F4F8] text-[#4A6274] text-[11px] font-medium flex-shrink-0">
              <UserCircle size={10} />
              {assignedUser.name.split(' ')[0]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          {submission.internalNotes?.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#9AABBF]">
              <MessageSquare size={10} />
              {submission.internalNotes.length}
            </span>
          )}
          <span className="text-[11px] text-[#B0BEC9]">
            {formatDate(submission.createdAt.toDate())}
          </span>
        </div>
      </div>
    </div>
  );
}

export const SubmissionCard = memo(SubmissionCardComponent);
