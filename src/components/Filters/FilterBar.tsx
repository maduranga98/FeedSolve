import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getCompanyMembers } from '../../lib/firestore';
import type { Submission, Board, User } from '../../types';
import { Button } from '../Shared';
import { X, ChevronDown } from 'lucide-react';

interface FilterBarProps {
  boards: Board[];
  onStatusChange: (statuses: Submission['status'][]) => void;
  onBoardChange: (boards: string[]) => void;
  onAssigneeChange: (assignees: string[]) => void;
  onPriorityChange: (priorities: Submission['priority'][]) => void;
  onDateRangeChange: (start?: Date, end?: Date) => void;
  onClear: () => void;
  activeFilterCount: number;
  currentFilters: {
    status: Submission['status'][];
    board: string[];
    assignee: string[];
    priority: Submission['priority'][];
    dateRange: { start?: Date; end?: Date };
  };
}

const statuses: { value: Submission['status']; label: string }[] = [
  { value: 'received', label: 'Received' },
  { value: 'in_review', label: 'In Review' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const priorities: { value: Submission['priority']; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="inline-flex items-center gap-2 px-2 py-1 bg-[#E0E8EF] text-[#1E3A5F] rounded text-sm">
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="hover:text-[#444441]"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function FilterBar({
  boards,
  onStatusChange,
  onBoardChange,
  onAssigneeChange,
  onPriorityChange,
  onDateRangeChange,
  onClear,
  activeFilterCount,
  currentFilters,
}: FilterBarProps) {
  const { user } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [members, setMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const loadMembers = async () => {
    if (!user || members.length > 0) return;
    setLoadingMembers(true);
    try {
      const data = await getCompanyMembers(user.companyId);
      setMembers(data);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleStatusToggle = (status: Submission['status']) => {
    const newStatuses = currentFilters.status.includes(status)
      ? currentFilters.status.filter((s) => s !== status)
      : [...currentFilters.status, status];
    onStatusChange(newStatuses);
  };

  const handleBoardToggle = (boardId: string) => {
    const newBoards = currentFilters.board.includes(boardId)
      ? currentFilters.board.filter((b) => b !== boardId)
      : [...currentFilters.board, boardId];
    onBoardChange(newBoards);
  };

  const handleAssigneeToggle = (assigneeId: string) => {
    const newAssignees = currentFilters.assignee.includes(assigneeId)
      ? currentFilters.assignee.filter((a) => a !== assigneeId)
      : [...currentFilters.assignee, assigneeId];
    onAssigneeChange(newAssignees);
  };

  const handlePriorityToggle = (priority: Submission['priority']) => {
    const newPriorities = currentFilters.priority.includes(priority)
      ? currentFilters.priority.filter((p) => p !== priority)
      : [...currentFilters.priority, priority];
    onPriorityChange(newPriorities);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => {
            setShowFilters(!showFilters);
            loadMembers();
          }}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-[#D3D1C7] rounded text-sm text-[#444441] hover:bg-[#F8FAFB] transition-colors"
        >
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-[#2E86AB] text-white rounded text-xs font-medium">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {activeFilterCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onClear}
          >
            Clear All
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="bg-white border border-[#D3D1C7] rounded-lg p-4 space-y-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-[#444441] mb-2">
              Status
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {statuses.map((status) => (
                <label key={status.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentFilters.status.includes(status.value)}
                    onChange={() => handleStatusToggle(status.value)}
                    className="rounded border-[#D3D1C7]"
                  />
                  <span className="text-sm text-[#6B7B8D]">{status.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Board Filter */}
          <div>
            <label className="block text-sm font-medium text-[#444441] mb-2">
              Board
            </label>
            <div className="space-y-2">
              {boards.map((board) => (
                <label key={board.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentFilters.board.includes(board.id)}
                    onChange={() => handleBoardToggle(board.id)}
                    className="rounded border-[#D3D1C7]"
                  />
                  <span className="text-sm text-[#6B7B8D]">{board.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Assignee Filter */}
          <div>
            <label className="block text-sm font-medium text-[#444441] mb-2">
              Assigned To
            </label>
            <div className="space-y-2">
              {loadingMembers ? (
                <p className="text-xs text-[#6B7B8D]">Loading...</p>
              ) : members.length === 0 ? (
                <p className="text-xs text-[#6B7B8D]">No team members</p>
              ) : (
                members.map((member) => (
                  <label key={member.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentFilters.assignee.includes(member.id)}
                      onChange={() => handleAssigneeToggle(member.id)}
                      className="rounded border-[#D3D1C7]"
                    />
                    <span className="text-sm text-[#6B7B8D]">{member.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-[#444441] mb-2">
              Priority
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {priorities.map((priority) => (
                <label key={priority.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentFilters.priority.includes(priority.value)}
                    onChange={() => handlePriorityToggle(priority.value)}
                    className="rounded border-[#D3D1C7]"
                  />
                  <span className="text-sm text-[#6B7B8D]">{priority.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-[#444441] mb-2">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={currentFilters.dateRange.start ? currentFilters.dateRange.start.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const start = e.target.value ? new Date(e.target.value) : undefined;
                  onDateRangeChange(start, currentFilters.dateRange.end);
                }}
                className="px-2 py-1 border border-[#D3D1C7] rounded text-sm"
              />
              <input
                type="date"
                value={currentFilters.dateRange.end ? currentFilters.dateRange.end.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const end = e.target.value ? new Date(e.target.value) : undefined;
                  onDateRangeChange(currentFilters.dateRange.start, end);
                }}
                className="px-2 py-1 border border-[#D3D1C7] rounded text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {currentFilters.status.map((status) => (
            <FilterTag
              key={status}
              label={statuses.find((s) => s.value === status)?.label || status}
              onRemove={() => handleStatusToggle(status)}
            />
          ))}
          {currentFilters.board.map((boardId) => (
            <FilterTag
              key={boardId}
              label={boards.find((b) => b.id === boardId)?.name || boardId}
              onRemove={() => handleBoardToggle(boardId)}
            />
          ))}
          {currentFilters.assignee.map((assigneeId) => (
            <FilterTag
              key={assigneeId}
              label={members.find((m) => m.id === assigneeId)?.name || assigneeId}
              onRemove={() => handleAssigneeToggle(assigneeId)}
            />
          ))}
          {currentFilters.priority.map((priority) => (
            <FilterTag
              key={priority}
              label={priorities.find((p) => p.value === priority)?.label || priority}
              onRemove={() => handlePriorityToggle(priority)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
