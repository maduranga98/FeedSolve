import { useState } from 'react';
import { ChevronDown, Save } from 'lucide-react';
import type { SearchFilters, Submission, Board, User } from '../../types';
import { Button } from '../Shared';

interface AdvancedFilterPanelProps {
  boards: Board[];
  users: User[];
  categories: string[];
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSaveFilter?: (name: string, description?: string) => Promise<void>;
}

const statusOptions: { value: Submission['status']; label: string }[] = [
  { value: 'received', label: 'Received' },
  { value: 'in_review', label: 'In Review' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const priorityOptions: { value: Submission['priority']; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export function AdvancedFilterPanel({
  boards,
  categories,
  filters,
  onFiltersChange,
  onSaveFilter,
}: AdvancedFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [saveModal, setSaveModal] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterDescription, setFilterDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleStatusToggle = (status: Submission['status']) => {
    const newStatuses = filters.status?.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...(filters.status || []), status];

    onFiltersChange({ ...filters, status: newStatuses });
  };

  const handlePriorityToggle = (priority: Submission['priority']) => {
    const newPriorities = filters.priority?.includes(priority)
      ? filters.priority.filter((p) => p !== priority)
      : [...(filters.priority || []), priority];

    onFiltersChange({ ...filters, priority: newPriorities });
  };

  const handleBoardToggle = (boardId: string) => {
    const newBoards = filters.boardId?.includes(boardId)
      ? filters.boardId.filter((b) => b !== boardId)
      : [...(filters.boardId || []), boardId];

    onFiltersChange({ ...filters, boardId: newBoards });
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.category?.includes(category)
      ? filters.category.filter((c) => c !== category)
      : [...(filters.category || []), category];

    onFiltersChange({ ...filters, category: newCategories });
  };

  const handleSaveFilter = async () => {
    if (!filterName.trim() || !onSaveFilter) return;

    setSaving(true);
    try {
      await onSaveFilter(filterName, filterDescription);
      setFilterName('');
      setFilterDescription('');
      setSaveModal(false);
    } finally {
      setSaving(false);
    }
  };

  const activeFilterCount = [
    ...(filters.status || []),
    ...(filters.priority || []),
    ...(filters.boardId || []),
    ...(filters.category || []),
    ...(filters.assignedTo ? [filters.assignedTo] : []),
    ...(filters.dateRange ? ['dateRange'] : []),
  ].length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#D3D1C7] rounded-lg text-sm text-[#444441] hover:bg-[#F8FAFB] transition-colors"
        >
          <span>Advanced Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-[#2E86AB] text-white rounded text-xs font-medium">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            size={16}
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {onSaveFilter && activeFilterCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSaveModal(true)}
            className="flex items-center gap-2"
          >
            <Save size={16} />
            Save Filter
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="bg-white border border-[#D3D1C7] rounded-lg p-4 space-y-4">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-[#444441] mb-2">Status</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {statusOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.status?.includes(option.value) || false}
                    onChange={() => handleStatusToggle(option.value)}
                    className="rounded border-[#D3D1C7]"
                  />
                  <span className="text-sm text-[#6B7B8D]">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-[#444441] mb-2">Priority</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {priorityOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.priority?.includes(option.value) || false}
                    onChange={() => handlePriorityToggle(option.value)}
                    className="rounded border-[#D3D1C7]"
                  />
                  <span className="text-sm text-[#6B7B8D]">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Boards */}
          {boards.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[#444441] mb-2">Boards</label>
              <div className="space-y-2">
                {boards.map((board) => (
                  <label key={board.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.boardId?.includes(board.id) || false}
                      onChange={() => handleBoardToggle(board.id)}
                      className="rounded border-[#D3D1C7]"
                    />
                    <span className="text-sm text-[#6B7B8D]">{board.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[#444441] mb-2">Categories</label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <label key={category} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.category?.includes(category) || false}
                      onChange={() => handleCategoryToggle(category)}
                      className="rounded border-[#D3D1C7]"
                    />
                    <span className="text-sm text-[#6B7B8D]">{category}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-[#444441] mb-2">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={
                  filters.dateRange?.from instanceof Date
                    ? filters.dateRange.from.toISOString().split('T')[0]
                    : filters.dateRange?.from
                    ? filters.dateRange.from.toDate().toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => {
                  const from = e.target.value ? new Date(e.target.value) : undefined;
                  onFiltersChange({
                    ...filters,
                    dateRange: from
                      ? {
                          from,
                          to:
                            filters.dateRange?.to instanceof Date
                              ? filters.dateRange.to
                              : filters.dateRange?.to
                              ? filters.dateRange.to.toDate()
                              : new Date(),
                        }
                      : undefined,
                  });
                }}
                className="px-2 py-1 border border-[#D3D1C7] rounded text-sm"
              />
              <input
                type="date"
                value={
                  filters.dateRange?.to instanceof Date
                    ? filters.dateRange.to.toISOString().split('T')[0]
                    : filters.dateRange?.to
                    ? filters.dateRange.to.toDate().toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => {
                  const to = e.target.value ? new Date(e.target.value) : undefined;
                  onFiltersChange({
                    ...filters,
                    dateRange: to
                      ? {
                          from:
                            filters.dateRange?.from instanceof Date
                              ? filters.dateRange.from
                              : filters.dateRange?.from
                              ? filters.dateRange.from.toDate()
                              : new Date(),
                          to,
                        }
                      : undefined,
                  });
                }}
                className="px-2 py-1 border border-[#D3D1C7] rounded text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Save Filter Modal */}
      {saveModal && onSaveFilter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-[#444441] mb-4">Save Filter</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#444441] mb-2">
                  Filter Name *
                </label>
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="e.g., High Priority Open Issues"
                  className="w-full px-3 py-2 border border-[#D3D1C7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#444441] mb-2">
                  Description
                </label>
                <textarea
                  value={filterDescription}
                  onChange={(e) => setFilterDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={3}
                  className="w-full px-3 py-2 border border-[#D3D1C7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setSaveModal(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveFilter}
                disabled={saving || !filterName.trim()}
              >
                {saving ? 'Saving...' : 'Save Filter'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
