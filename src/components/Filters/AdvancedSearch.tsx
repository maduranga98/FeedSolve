import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSearch } from '../../hooks/useSearch';
import { useSavedFilters } from '../../hooks/useSavedFilters';
import { useURLFilters } from '../../hooks/useURLFilters';
import { getCompanyBoards } from '../../lib/firestore';
import type { Submission, Board, User } from '../../types';
import { SearchBar } from './SearchBar';
import { FilterChips } from './FilterChips';
import { AdvancedFilterPanel } from './AdvancedFilterPanel';
import { SavedFilters } from './SavedFilters';
import { QuickFilters } from './QuickFilters';
import { SearchResults } from './SearchResults';
import { LoadingSpinner } from '../Shared';
import { Copy, Download } from 'lucide-react';

interface AdvancedSearchProps {
  submissions: Submission[];
  users: User[];
  onSubmissionClick: (submission: Submission) => void;
}

export function AdvancedSearch({
  submissions,
  users,
  onSubmissionClick,
}: AdvancedSearchProps) {
  const { user } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const { searchText, setSearchText, filters, setFilters, results, clearAll: clearSearch } = useSearch(submissions);
  const { savedFilters, saveFilter, deleteFilter, togglePin } = useSavedFilters(user?.companyId || '');
  const { filters: urlFilters, updateFilters: updateURLFilters, getShareURL } = useURLFilters();

  const categories = Array.from(
    new Set(submissions.map((s) => s.category))
  );

  useEffect(() => {
    const loadBoards = async () => {
      if (!user) return;
      try {
        const data = await getCompanyBoards(user.companyId);
        setBoards(data);
      } catch (error) {
        console.error('Failed to load boards:', error);
      }
    };
    loadBoards();
  }, [user]);

  const handleSaveFilter = async (name: string, description?: string) => {
    if (!user) return;
    try {
      setLoading(true);
      await saveFilter(name, filters, user.id, description);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyQuickFilter = (quickFilters: any) => {
    setFilters(quickFilters);
    updateURLFilters(quickFilters);
    setPage(1);
  };

  const handleSelectSavedFilter = (filter: any) => {
    setFilters(filter.filters);
    updateURLFilters(filter.filters);
    setPage(1);
  };

  const handleCopyShareLink = () => {
    const url = getShareURL();
    navigator.clipboard.writeText(url);
  };

  const handleExportCSV = async () => {
    if (!user) return;
    try {
      const link = document.createElement('a');
      link.href = `/api/search/export-csv?companyId=${user.companyId}&filters=${encodeURIComponent(JSON.stringify(filters))}`;
      link.click();
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <SearchBar
        value={searchText}
        onChange={setSearchText}
        placeholder="Search by subject, description, category, or tracking code..."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Filters */}
          <QuickFilters onApply={handleApplyQuickFilter} userId={user?.id} />

          {/* Advanced Filters */}
          <AdvancedFilterPanel
            boards={boards}
            users={users}
            categories={categories}
            filters={filters}
            onFiltersChange={(newFilters) => {
              setFilters(newFilters);
              updateURLFilters(newFilters);
              setPage(1);
            }}
            onSaveFilter={handleSaveFilter}
          />

          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <div className="bg-white rounded-lg border border-[#D3D1C7] p-4">
              <h3 className="text-sm font-semibold text-[#444441] mb-3">Saved Filters</h3>
              <SavedFilters
                filters={savedFilters}
                onSelect={handleSelectSavedFilter}
                onDelete={deleteFilter}
                onTogglePin={togglePin}
              />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filter Chips */}
          {Object.keys(filters).length > 0 && (
            <FilterChips
              filters={filters}
              boards={boards}
              users={users}
              onRemoveStatus={(status) =>
                setFilters({
                  ...filters,
                  status: filters.status?.filter((s) => s !== status),
                })
              }
              onRemovePriority={(priority) =>
                setFilters({
                  ...filters,
                  priority: filters.priority?.filter((p) => p !== priority),
                })
              }
              onRemoveBoard={(boardId) =>
                setFilters({
                  ...filters,
                  boardId: filters.boardId?.filter((b) => b !== boardId),
                })
              }
              onRemoveCategory={(category) =>
                setFilters({
                  ...filters,
                  category: filters.category?.filter((c) => c !== category),
                })
              }
              onRemoveAssignee={() =>
                setFilters({ ...filters, assignedTo: undefined })
              }
              onRemoveDateRange={() =>
                setFilters({ ...filters, dateRange: undefined })
              }
              onClearAll={() => {
                setFilters({});
                updateURLFilters({});
                clearSearch();
                setPage(1);
              }}
            />
          )}

          {/* Results Header */}
          {results.length > 0 && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-[#6B7B8D]">
                Found {results.length} submission{results.length !== 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyShareLink}
                  className="px-3 py-2 text-sm text-[#2E86AB] hover:bg-[#E0E8EF] rounded transition-colors flex items-center gap-2"
                  title="Copy share link"
                >
                  <Copy size={16} />
                  Share
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-2 text-sm text-[#2E86AB] hover:bg-[#E0E8EF] rounded transition-colors flex items-center gap-2"
                >
                  <Download size={16} />
                  Export CSV
                </button>
              </div>
            </div>
          )}

          {/* Search Results */}
          {loading ? (
            <LoadingSpinner size="lg" className="min-h-96" />
          ) : (
            <SearchResults
              results={results}
              onSubmissionClick={onSubmissionClick}
              page={page}
              pageSize={50}
            />
          )}
        </div>
      </div>
    </div>
  );
}
