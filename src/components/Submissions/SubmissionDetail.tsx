import { useState } from 'react';
import type { Submission } from '../../types';
import { Button } from '../Shared';
import { X } from 'lucide-react';
import AssignDropdown from './AssignDropdown';
import PriorityDropdown from './PriorityDropdown';
import InternalNotesSection from './InternalNotesSection';
import { updateSubmissionStatus } from '../../lib/firestore';
import { formatDate } from '../../lib/utils';

interface SubmissionDetailProps {
  submission: Submission;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function SubmissionDetail({
  submission,
  onClose,
  onUpdated,
}: SubmissionDetailProps) {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: Submission['status']) => {
    setLoading(true);
    try {
      await updateSubmissionStatus(submission.id, newStatus);
      onUpdated?.();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="sticky top-0 bg-white border-b border-[#D3D1C7] p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1E3A5F]">
            {submission.subject}
          </h2>
          <button
            onClick={onClose}
            className="text-[#6B7B8D] hover:text-[#444441]"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Tracking Code */}
          <div>
            <label className="block text-sm font-medium text-[#444441] mb-1">
              Tracking Code
            </label>
            <p className="text-[#1E3A5F] font-mono">{submission.trackingCode}</p>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#444441] mb-2">
                Status
              </label>
              <select
                value={submission.status}
                onChange={(e) =>
                  handleStatusChange(e.target.value as Submission['status'])
                }
                disabled={loading}
                className="w-full px-3 py-2 border border-[#D3D1C7] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86AB]"
              >
                <option value="received">Received</option>
                <option value="in_review">In Review</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#444441] mb-2">
                Priority
              </label>
              <PriorityDropdown
                submissionId={submission.id}
                currentPriority={submission.priority}
                onUpdated={onUpdated}
              />
            </div>
          </div>

          {/* Assignment */}
          <div>
            <label className="block text-sm font-medium text-[#444441] mb-2">
              Assign To
            </label>
            <AssignDropdown
              submissionId={submission.id}
              assignedToId={submission.assignedTo}
              onAssigned={onUpdated}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#444441] mb-2">
              Description
            </label>
            <p className="text-[#444441] whitespace-pre-wrap">
              {submission.description}
            </p>
          </div>

          {/* Category & Submitter Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block font-medium text-[#444441] mb-1">
                Category
              </label>
              <p className="text-[#6B7B8D]">{submission.category}</p>
            </div>
            <div>
              <label className="block font-medium text-[#444441] mb-1">
                Submitted
              </label>
              <p className="text-[#6B7B8D]">
                {formatDate(submission.createdAt.toDate())}
              </p>
            </div>
            {submission.submitterEmail && !submission.isAnonymous && (
              <div>
                <label className="block font-medium text-[#444441] mb-1">
                  Email
                </label>
                <p className="text-[#6B7B8D]">{submission.submitterEmail}</p>
              </div>
            )}
            {submission.isAnonymous && (
              <div>
                <label className="block font-medium text-[#444441] mb-1">
                  Anonymous
                </label>
                <p className="text-[#6B7B8D]">Yes</p>
              </div>
            )}
          </div>

          {/* Internal Notes */}
          <div className="border-t border-[#D3D1C7] pt-6">
            <InternalNotesSection
              submissionId={submission.id}
              notes={submission.internalNotes}
              onNoteAdded={onUpdated}
            />
          </div>

          {/* Public Reply */}
          {submission.publicReply && (
            <div className="bg-[#F8FAFB] border border-[#D3D1C7] rounded p-4">
              <label className="block text-sm font-medium text-[#444441] mb-2">
                Public Reply
              </label>
              <p className="text-[#444441] text-sm whitespace-pre-wrap">
                {submission.publicReply}
              </p>
            </div>
          )}

          {/* Close Button */}
          <div className="pt-4 border-t border-[#D3D1C7]">
            <Button variant="secondary" fullWidth onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
