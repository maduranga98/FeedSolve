import { useState } from 'react';
import { X } from 'lucide-react';

export interface AnalyticsFilters {
  boards: string[];
  categories: string[];
  statuses: string[];
  priorities: string[];
  assignedTo: string[];
}

interface FilterPanelProps {
  filters: AnalyticsFilters;
  boards: Array<{ id: string; name: string }>;
  categories: string[];
  onFiltersChange: (filters: AnalyticsFilters) => void;
  onClose?: () => void;
}

export function FilterPanel({
  filters,
  boards,
  categories,
  onFiltersChange,
  onClose,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleBoardToggle = (boardId: string) => {
    onFiltersChange({
      ...filters,
      boards: filters.boards.includes(boardId)
        ? filters.boards.filter((b) => b !== boardId)
        : [...filters.boards, boardId],
    });
  };

  const handleCategoryToggle = (category: string) => {
    onFiltersChange({
      ...filters,
      categories: filters.categories.includes(category)
        ? filters.categories.filter((c) => c !== category)
        : [...filters.categories, category],
    });
  };

  const handleStatusToggle = (status: string) => {
    onFiltersChange({
      ...filters,
      statuses: filters.statuses.includes(status)
        ? filters.statuses.filter((s) => s !== status)
        : [...filters.statuses, status],
    });
  };

  const handlePriorityToggle = (priority: string) => {
    onFiltersChange({
      ...filters,
      priorities: filters.priorities.includes(priority)
        ? filters.priorities.filter((p) => p !== priority)
        : [...filters.priorities, priority],
    });
  };

  const activeFilterCount =
    filters.boards.length +
    filters.categories.length +
    filters.statuses.length +
    filters.priorities.length;

  const statusOptions = ['received', 'in_review', 'in_progress', 'resolved', 'closed'];
  const priorityOptions = ['low', 'medium', 'high', 'critical'];

  return (
    <div className="bg-color-surface rounded-lg shadow-md">
      <div
        className="p-6 flex items-center justify-between cursor-pointer hover:bg-color-bg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h3 className="text-lg font-semibold text-color-primary">Filters</h3>
          {activeFilterCount > 0 && (
            <p className="text-sm text-color-muted-text mt-1">
              {activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFiltersChange({
                  boards: [],
                  categories: [],
                  statuses: [],
                  priorities: [],
                  assignedTo: [],
                });
              }}
              className="px-3 py-1 text-sm bg-color-primary text-white rounded hover:opacity-90"
            >
              Clear All
            </button>
          )}
          <span className="text-color-muted-text">{isExpanded ? '−' : '+'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-color-border p-6 space-y-6">
          {/* Boards */}
          {boards.length > 0 && (
            <div>
              <h4 className="font-medium text-color-body-text mb-3">Boards</h4>
              <div className="space-y-2">
                {boards.map((board) => (
                  <label key={board.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.boards.includes(board.id)}
                      onChange={() => handleBoardToggle(board.id)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-color-body-text">{board.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <h4 className="font-medium text-color-body-text mb-3">Categories</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {categories.map((category) => (
                  <label key={category} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-color-body-text">{category}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <h4 className="font-medium text-color-body-text mb-3">Status</h4>
            <div className="space-y-2">
              {statusOptions.map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.statuses.includes(status)}
                    onChange={() => handleStatusToggle(status)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-color-body-text capitalize">
                    {status.replace(/_/g, ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <h4 className="font-medium text-color-body-text mb-3">Priority</h4>
            <div className="space-y-2">
              {priorityOptions.map((priority) => (
                <label key={priority} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.priorities.includes(priority)}
                    onChange={() => handlePriorityToggle(priority)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-color-body-text capitalize">{priority}</span>
                </label>
              ))}
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="w-full mt-4 px-4 py-2 text-sm font-medium text-color-body-text border border-color-border rounded hover:bg-color-bg"
            >
              Done
            </button>
          )}
        </div>
      )}
    </div>
  );
}
