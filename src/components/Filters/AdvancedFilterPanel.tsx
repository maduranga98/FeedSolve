import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, SlidersHorizontal, Save } from 'lucide-react';
import type { SearchFilters, Submission, Board, User } from '../../types';
import { Button } from '../Shared';

interface AdvancedFilterPanelProps {
  boards: Board[];
  users: User[];
  categories: string[];
  locations: string[];
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
  locations,
  filters,
  onFiltersChange,
  onSaveFilter,
}: AdvancedFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [saveModal, setSaveModal] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterDescription, setFilterDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const handleStatusToggle = (status: Submission['status']) => {
    const next = filters.status?.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...(filters.status || []), status];
    onFiltersChange({ ...filters, status: next });
  };

  const handlePriorityToggle = (priority: Submission['priority']) => {
    const next = filters.priority?.includes(priority)
      ? filters.priority.filter((p) => p !== priority)
      : [...(filters.priority || []), priority];
    onFiltersChange({ ...filters, priority: next });
  };

  const handleBoardToggle = (boardId: string) => {
    const next = filters.boardId?.includes(boardId)
      ? filters.boardId.filter((b) => b !== boardId)
      : [...(filters.boardId || []), boardId];
    onFiltersChange({ ...filters, boardId: next });
  };

  const handleCategoryToggle = (category: string) => {
    const next = filters.category?.includes(category)
      ? filters.category.filter((c) => c !== category)
      : [...(filters.category || []), category];
    onFiltersChange({ ...filters, category: next });
  };

  const handleLocationToggle = (location: string) => {
    const next = filters.location?.includes(location)
      ? filters.location.filter((item) => item !== location)
      : [...(filters.location || []), location];
    onFiltersChange({ ...filters, location: next });
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
    ...(filters.location || []),
    ...(filters.assignedTo ? [filters.assignedTo] : []),
    ...(filters.dateRange ? ['dateRange'] : []),
  ].length;

  const isActive = isOpen || activeFilterCount > 0;

  const PillButton = ({
    label,
    active,
    onClick,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
        active
          ? 'bg-[var(--c-s1e3a5f)] text-white border-[var(--c-b1e3a5f)]'
          : 'bg-[var(--c-sffffff)] text-[var(--c-t6b7b8d)] border-[var(--c-be8ecf0)] hover:border-[var(--c-b2e86ab)] hover:text-[var(--c-t2e86ab)]'
      }`}
    >
      {label}
    </button>
  );

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[10px] font-bold text-[var(--c-t9aabbf)] uppercase tracking-widest mb-2">{children}</p>
  );

  return (
    <div ref={panelRef} className="relative flex-shrink-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${
          isActive
            ? 'bg-[var(--c-s1e3a5f)] text-white border-[var(--c-b1e3a5f)]'
            : 'bg-[var(--c-sffffff)] text-[var(--c-t444441)] border-[var(--c-bd3d1c7)] hover:bg-[var(--c-sf1f5f8)]'
        }`}
      >
        <SlidersHorizontal size={14} />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="text-[11px] px-1.5 py-0.5 rounded-full font-bold bg-white/25 text-white">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown size={13} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[420px] bg-[var(--c-sffffff)] border border-[var(--c-be8ecf0)] rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Dropdown header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--c-bf0f4f8)]">
            <h3 className="text-sm font-bold text-[var(--c-t1e3a5f)]">Filter Submissions</h3>
            <div className="flex items-center gap-3">
              {activeFilterCount > 0 && (
                <button
                  onClick={() => onFiltersChange({})}
                  className="text-xs font-medium text-[var(--c-t9aabbf)] hover:text-[var(--c-te74c3c)] transition-colors"
                >
                  Clear all
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-[var(--c-tc0c8d0)] hover:text-[var(--c-t6b7b8d)] transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-5 max-h-[72vh] overflow-y-auto">
            {/* Status */}
            <div>
              <SectionLabel>Status</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {statusOptions.map((opt) => (
                  <PillButton
                    key={opt.value}
                    label={opt.label}
                    active={filters.status?.includes(opt.value) ?? false}
                    onClick={() => handleStatusToggle(opt.value)}
                  />
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <SectionLabel>Priority</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {priorityOptions.map((opt) => (
                  <PillButton
                    key={opt.value}
                    label={opt.label}
                    active={filters.priority?.includes(opt.value) ?? false}
                    onClick={() => handlePriorityToggle(opt.value)}
                  />
                ))}
              </div>
            </div>

            {/* Boards */}
            {boards.length > 0 && (
              <div>
                <SectionLabel>Board</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {boards.map((board) => (
                    <PillButton
                      key={board.id}
                      label={board.name}
                      active={filters.boardId?.includes(board.id) ?? false}
                      onClick={() => handleBoardToggle(board.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <SectionLabel>Category</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <PillButton
                      key={cat}
                      label={cat}
                      active={filters.category?.includes(cat) ?? false}
                      onClick={() => handleCategoryToggle(cat)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Locations */}
            {locations.length > 0 && (
              <div>
                <SectionLabel>Location</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {locations.map((loc) => (
                    <PillButton
                      key={loc}
                      label={loc}
                      active={filters.location?.includes(loc) ?? false}
                      onClick={() => handleLocationToggle(loc)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Date Range */}
            <div>
              <SectionLabel>Date Range</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-[var(--c-t9aabbf)] mb-1">From</p>
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
                    className="w-full px-3 py-2 border border-[var(--c-be8ecf0)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-b2e86ab)] focus:border-transparent"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--c-t9aabbf)] mb-1">To</p>
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
                    className="w-full px-3 py-2 border border-[var(--c-be8ecf0)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-b2e86ab)] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer — Save Filter */}
          {onSaveFilter && activeFilterCount > 0 && (
            <div className="px-4 py-3 border-t border-[var(--c-bf0f4f8)] bg-[var(--c-sf8fafb)]">
              <button
                onClick={() => setSaveModal(true)}
                className="flex items-center gap-2 text-xs font-semibold text-[var(--c-t2e86ab)] hover:text-[var(--c-t1e6a9a)] transition-colors"
              >
                <Save size={13} />
                Save this filter combination
              </button>
            </div>
          )}
        </div>
      )}

      {/* Save Filter Modal */}
      {saveModal && onSaveFilter && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-[var(--c-sffffff)] rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border border-[var(--c-be8ecf0)]">
            <h3 className="text-base font-bold text-[var(--c-t1e3a5f)] mb-1">Save Filter</h3>
            <p className="text-xs text-[var(--c-t9aabbf)] mb-5">Give this filter combination a name so you can reuse it later.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--c-t444441)] mb-1.5">Filter Name *</label>
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="e.g., High Priority Open Issues"
                  className="w-full px-3 py-2 border border-[var(--c-bd3d1c7)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-b2e86ab)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--c-t444441)] mb-1.5">Description</label>
                <textarea
                  value={filterDescription}
                  onChange={(e) => setFilterDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={2}
                  className="w-full px-3 py-2 border border-[var(--c-bd3d1c7)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-b2e86ab)] resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="secondary" onClick={() => setSaveModal(false)} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveFilter} disabled={saving || !filterName.trim()}>
                {saving ? 'Saving…' : 'Save Filter'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
