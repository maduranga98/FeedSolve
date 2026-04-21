/**
 * Example: Integrating Bulk Operations into a Submissions List
 *
 * This example demonstrates how to use the bulk operations components
 * and hooks to add bulk actions to a submissions management interface.
 *
 * Usage:
 * <BulkOperationsExample submissions={submissions} teamMembers={teamMembers} />
 */

import { useState } from 'react';
import { useBulkOperations } from '../../hooks/useBulkOperations';
import { useBulkOperationStatus } from '../../hooks/useBulkOperationStatus';
import { Submission, User } from '../../types';
import { SelectAllCheckbox } from './SelectAllCheckbox';
import { BulkActionBar } from './BulkActionBar';
import { BulkActionModal } from './BulkActionModal';
import { BulkProgressIndicator } from './BulkProgressIndicator';

interface BulkOperationsExampleProps {
  submissions: Submission[];
  teamMembers: User[];
  onSubmissionsUpdated?: () => void;
}

type ActionType = 'status' | 'priority' | 'assign' | 'category' | 'delete' | null;

const STATUSES = ['received', 'in_review', 'in_progress', 'resolved', 'closed'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export function BulkOperationsExample({
  submissions,
  teamMembers,
  onSubmissionsUpdated,
}: BulkOperationsExampleProps) {
  const bulk = useBulkOperations();
  const [selectedAction, setSelectedAction] = useState<ActionType>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');

  const { operation, isProcessing } = useBulkOperationStatus(bulk.currentOperation?.id || null);

  const handleSelectAllChange = (checked: boolean) => {
    if (checked) {
      bulk.selectAll(submissions.map((s) => s.id));
    } else {
      bulk.deselectAll();
    }
  };

  const isAllSelected = bulk.selectedCount === submissions.length && submissions.length > 0;
  const isIndeterminate = bulk.selectedCount > 0 && !isAllSelected;

  const handleActionConfirm = async () => {
    try {
      switch (selectedAction) {
        case 'status':
          await bulk.updateStatus(selectedOption);
          break;
        case 'priority':
          await bulk.updatePriority(selectedOption);
          break;
        case 'assign':
          await bulk.assignTo(selectedOption);
          break;
        case 'category':
          await bulk.addToCategory(selectedOption);
          break;
        case 'delete':
          await bulk.deleteSelected();
          break;
      }
      setSelectedAction(null);
      setSelectedOption('');
      onSubmissionsUpdated?.();
    } catch (error) {
      console.error('Bulk operation failed:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress Indicator */}
      {operation && (
        <BulkProgressIndicator
          status={operation.status}
          processedCount={operation.processedCount}
          totalCount={operation.totalCount}
          operationType={`Bulk ${operation.operationType} update`}
          errorMessage={operation.errorMessage}
          onDismiss={bulk.clearOperation}
        />
      )}

      {/* Error Message */}
      {bulk.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex justify-between items-center">
          <p className="text-red-700">{bulk.error}</p>
          <button
            onClick={bulk.clearError}
            className="text-red-600 hover:text-red-800 font-medium text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Submissions Table with Selection */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left">
                <SelectAllCheckbox
                  isChecked={isAllSelected}
                  isIndeterminate={isIndeterminate}
                  onChange={handleSelectAllChange}
                  disabled={isProcessing}
                />
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Subject</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Priority</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr
                key={submission.id}
                className={`border-b border-gray-200 ${
                  bulk.selectedIds.has(submission.id) ? 'bg-blue-50' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={bulk.selectedIds.has(submission.id)}
                    onChange={() => bulk.toggleSelection(submission.id)}
                    disabled={isProcessing}
                    className="w-4 h-4 cursor-pointer accent-blue-600 disabled:opacity-50"
                  />
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{submission.subject}</td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      submission.status === 'resolved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {submission.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="text-gray-600">{submission.priority}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {submission.assignedTo ? 'Assigned' : 'Unassigned'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={bulk.selectedCount}
        totalCount={submissions.length}
        onSelectAll={() => bulk.selectAll(submissions.map((s) => s.id))}
        onDeselectAll={() => bulk.deselectAll()}
        onStatusChange={() => setSelectedAction('status')}
        onPriorityChange={() => setSelectedAction('priority')}
        onAssign={() => setSelectedAction('assign')}
        onCategoryChange={() => setSelectedAction('category')}
        onDelete={() => setSelectedAction('delete')}
        onClose={() => bulk.deselectAll()}
        isLoading={isProcessing || bulk.isLoading}
      />

      {/* Action Modals */}
      <BulkActionModal
        isOpen={selectedAction === 'status'}
        title="Change Status"
        message="Select a new status for all selected submissions"
        selectedCount={bulk.selectedCount}
        isLoading={isProcessing || bulk.isLoading}
        actionLabel="Update Status"
        onConfirm={handleActionConfirm}
        onCancel={() => {
          setSelectedAction(null);
          setSelectedOption('');
        }}
        customContent={
          <select
            value={selectedOption}
            onChange={(e) => setSelectedOption(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a status...</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        }
      />

      <BulkActionModal
        isOpen={selectedAction === 'priority'}
        title="Change Priority"
        message="Select a new priority for all selected submissions"
        selectedCount={bulk.selectedCount}
        isLoading={isProcessing || bulk.isLoading}
        actionLabel="Update Priority"
        onConfirm={handleActionConfirm}
        onCancel={() => {
          setSelectedAction(null);
          setSelectedOption('');
        }}
        customContent={
          <select
            value={selectedOption}
            onChange={(e) => setSelectedOption(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a priority...</option>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </option>
            ))}
          </select>
        }
      />

      <BulkActionModal
        isOpen={selectedAction === 'assign'}
        title="Assign Submissions"
        message="Select a team member to assign to all selected submissions"
        selectedCount={bulk.selectedCount}
        isLoading={isProcessing || bulk.isLoading}
        actionLabel="Assign"
        onConfirm={handleActionConfirm}
        onCancel={() => {
          setSelectedAction(null);
          setSelectedOption('');
        }}
        customContent={
          <select
            value={selectedOption}
            onChange={(e) => setSelectedOption(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a team member...</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.email})
              </option>
            ))}
          </select>
        }
      />

      <BulkActionModal
        isOpen={selectedAction === 'delete'}
        title="Delete Submissions"
        message="This will permanently delete all selected submissions. This action cannot be undone immediately."
        selectedCount={bulk.selectedCount}
        isDangerous={true}
        isLoading={isProcessing || bulk.isLoading}
        actionLabel="Delete"
        onConfirm={handleActionConfirm}
        onCancel={() => setSelectedAction(null)}
      />
    </div>
  );
}
