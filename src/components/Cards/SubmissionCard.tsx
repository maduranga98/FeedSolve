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
  low:      'bg-[var(--c-s3498db)]',
  medium:   'bg-[var(--c-sf39c12)]',
  high:     'bg-[var(--c-se74c3c)]',
  critical: 'bg-[var(--c-s8b0000)]',
};

const priorityLabel: Record<string, string> = {
  low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical',
};

const satisfactionEmoji: Record<number, string> = {
  1: '😠', 2: '😕', 3: '😐', 4: '😊', 5: '😄',
};

const satisfactionStyle: Record<number, string> = {
  1: 'bg-[var(--c-sfee2e2)] text-[var(--c-tb91c1c)]',
  2: 'bg-[var(--c-sfef3c7)] text-[var(--c-t92400e)]',
  3: 'bg-[var(--c-sf1f5f9)] text-[var(--c-t475569)]',
  4: 'bg-[var(--c-sdbeafe)] text-[var(--c-t1d4ed8)]',
  5: 'bg-[var(--c-sdcfce7)] text-[var(--c-t15803d)]',
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
      className={`group relative bg-[var(--c-sffffff)] rounded-xl p-4 transition-all duration-150 border
        ${isSelected
          ? 'border-l-[3px] border-l-[#2E86AB] border-[var(--c-bc8ddf0)] bg-[var(--c-sf8fbfd)]'
          : 'border-[var(--c-be8ecf0)] hover:border-[var(--c-bc8ddf0)]'
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
              className="w-4 h-4 cursor-pointer accent-[var(--c-s2e86ab)]"
              aria-label={`Select ${submission.subject}`}
            />
          </div>
        )}

        <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-[var(--c-t1e3a5f)] truncate mb-0.5 ${compact ? 'text-[15px]' : 'text-sm'}`}>
              {submission.subject}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[11px] text-[var(--c-t9aabbf)] font-mono">{submission.trackingCode}</p>
              {submission.isMerged && (
                <span className="rounded-full bg-[var(--c-sf1efe8)] px-2 py-0.5 text-[11px] font-semibold text-[var(--c-t5f5e5a)]">
                  Merged
                </span>
              )}
            </div>
          </div>
          <Badge status={submission.status} className="flex-shrink-0 mt-0.5" />
        </div>
      </div>

      {/* Description */}
      <p className={`text-xs text-[var(--c-t6b7b8d)] leading-relaxed ${compact ? 'mb-2.5 line-clamp-1' : 'mb-3 line-clamp-2'}`}>
        {submission.description}
      </p>

      {/* Footer */}
      <div className={`flex items-center justify-between gap-x-2 gap-y-1.5 flex-wrap ${compact ? 'pt-2 border-t border-[var(--c-bf0f4f8)]' : ''}`}>
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[var(--c-sebf5fb)] text-[var(--c-t2e86ab)] text-[11px] font-semibold flex-shrink-0">
            {submission.category}
          </span>

          {submission.location && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--c-seff3f6)] text-[var(--c-t6b7b8d)] text-[11px] font-medium flex-shrink-0">
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

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--c-se1e8ef)] text-[var(--c-t6b7b8d)] text-[11px] font-medium flex-shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
            {priorityLabel[submission.priority] || submission.priority}
          </span>

          {assignedUser && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--c-sf0f4f8)] text-[var(--c-t4a6274)] text-[11px] font-medium flex-shrink-0">
              <UserCircle size={10} />
              {assignedUser.name.split(' ')[0]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          {submission.internalNotes?.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--c-t9aabbf)]">
              <MessageSquare size={10} />
              {submission.internalNotes.length}
            </span>
          )}
          <span className="text-[11px] text-[var(--c-tb0bec9)]">
            {formatDate(submission.createdAt.toDate())}
          </span>
        </div>
      </div>
    </div>
  );
}

export const SubmissionCard = memo(SubmissionCardComponent);
