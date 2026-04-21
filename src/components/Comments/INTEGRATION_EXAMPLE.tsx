/**
 * INTEGRATION EXAMPLE
 *
 * This file shows how to integrate the CommentThread component
 * into your submission detail pages.
 *
 * Copy this pattern into your SubmissionDetail or similar component.
 */

import { useState } from 'react';
import type { Submission, User, TeamMember } from '../../types';
import { CommentThread } from './CommentThread';
import { useCommentNotifications } from '../../hooks/useCommentNotifications';

interface SubmissionDetailProps {
  submission: Submission;
  currentUser: User;
  teamMembers: TeamMember[];
}

export const SubmissionDetailWithComments: React.FC<SubmissionDetailProps> = ({
  submission,
  currentUser,
  teamMembers,
}) => {
  const [showComments, setShowComments] = useState(true);
  const { unreadCount, notifications } = useCommentNotifications(
    submission.companyId,
    currentUser.id
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Submission Details (Left) */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {submission.subject}
          </h1>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="text-lg font-semibold text-gray-900">
                {submission.status}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Priority</label>
              <p className="text-lg font-semibold text-gray-900">
                {submission.priority}
              </p>
            </div>
          </div>

          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">
              {submission.description}
            </p>
          </div>
        </div>
      </div>

      {/* Sidebar (Right) */}
      <div className="lg:col-span-1">
        {/* Comments Widget */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-6">
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center justify-between w-full"
          >
            <h3 className="font-semibold text-blue-900">Comments</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <span className="bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                  {unreadCount}
                </span>
              )}
              <span className={showComments ? '▼' : '▶'}>
              </span>
            </div>
          </button>
        </div>

        {/* Other Sidebar Items */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          {currentUser && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-500">Assigned To</label>
                <p className="text-gray-900">{submission.assignedTo || 'Unassigned'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Category</label>
                <p className="text-gray-900">{submission.category}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Comments Section - Full Width */}
      {showComments && (
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <CommentThread
              submissionId={submission.id}
              companyId={submission.companyId}
              currentUser={currentUser}
              teamMembers={teamMembers}
              onCommentAdded={(count) => {
                // You can use this callback to update parent state
                console.log(`Total comments: ${count}`);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * USAGE IN YOUR PAGE COMPONENT
 *
 * function SubmissionPage() {
 *   const { submissionId } = useParams();
 *   const [submission, setSubmission] = useState<Submission | null>(null);
 *   const { user } = useAuth();
 *   const { teamMembers } = useTeam();
 *   const [isLoading, setIsLoading] = useState(true);
 *
 *   useEffect(() => {
 *     // Load submission data
 *     loadSubmission(submissionId).then(data => {
 *       setSubmission(data);
 *       setIsLoading(false);
 *     });
 *   }, [submissionId]);
 *
 *   if (isLoading || !submission || !user) {
 *     return <LoadingSpinner />;
 *   }
 *
 *   return (
 *     <div className="min-h-screen bg-gray-50 p-6">
 *       <SubmissionDetailWithComments
 *         submission={submission}
 *         currentUser={user}
 *         teamMembers={teamMembers}
 *       />
 *     </div>
 *   );
 * }
 */

/**
 * ALTERNATIVE: USING HOOKS DIRECTLY
 *
 * If you want to use the comment hooks separately without the full CommentThread component:
 */

import { useComments } from '../../hooks/useComments';

export function SubmissionWithCommentsCount({ submissionId }: { submissionId: string }) {
  const { commentCount, isLoading } = useComments(submissionId);

  return (
    <div className="flex items-center gap-2">
      <span>Comments:</span>
      {isLoading ? (
        <span className="text-gray-400">...</span>
      ) : (
        <span className="font-bold text-blue-600">{commentCount}</span>
      )}
    </div>
  );
}

/**
 * DISPLAYING NOTIFICATIONS
 *
 * Example: Show notification badge in navigation
 */

export function NotificationBadge({
  companyId,
  userId,
}: {
  companyId: string;
  userId: string;
}) {
  const { unreadCount } = useCommentNotifications(companyId, userId);

  if (unreadCount === 0) return null;

  return (
    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
      {unreadCount}
    </span>
  );
}
