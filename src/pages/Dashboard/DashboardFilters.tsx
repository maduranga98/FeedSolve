import { Button, Input, Select } from '../../components/Shared';
import type { Board } from '../../types';

interface DashboardFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedBoard: string;
  onBoardChange: (boardId: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedPriority: string;
  onPriorityChange: (priority: string) => void;
  boards: Board[];
  onReset: () => void;
  submissionCount: number;
}

export function DashboardFilters({
  searchQuery,
  onSearchChange,
  selectedBoard,
  onBoardChange,
  selectedStatus,
  onStatusChange,
  selectedPriority,
  onPriorityChange,
  boards,
  onReset,
  submissionCount,
}: DashboardFiltersProps) {
  const boardOptions = [
    { value: 'all', label: 'All Boards' },
    ...boards.map((board) => ({ value: board.id, label: board.name })),
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'received', label: 'Received' },
    { value: 'in_review', label: 'In Review' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ];

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  const isFiltered =
    searchQuery || selectedBoard !== 'all' || selectedStatus || selectedPriority;

  return (
    <div className="bg-color-surface rounded-lg shadow-md p-6 mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-color-primary">Filters</h2>
        {isFiltered && (
          <Button variant="secondary" size="sm" onClick={onReset}>
            Reset Filters
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Input
          label="Search"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by subject, description..."
        />

        <Select
          label="Board"
          value={selectedBoard}
          onChange={(e) => onBoardChange(e.target.value)}
          options={boardOptions}
        />

        <Select
          label="Status"
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          options={statusOptions}
        />

        <Select
          label="Priority"
          value={selectedPriority}
          onChange={(e) => onPriorityChange(e.target.value)}
          options={priorityOptions}
        />

        <div className="flex items-end">
          <div className="text-sm">
            <p className="font-medium text-color-body-text">Results</p>
            <p className="text-lg font-bold text-color-accent">{submissionCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
