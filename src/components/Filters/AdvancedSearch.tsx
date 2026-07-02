import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useSearch } from '../../hooks/useSearch';
import { useSavedFilters } from '../../hooks/useSavedFilters';
import { useURLFilters } from '../../hooks/useURLFilters';
import { getCompanyBoards } from '../../lib/firestore';
import type { Submission, Board, User, SavedFilter, SearchFilters } from '../../types';
import { SearchBar } from './SearchBar';
import { FilterChips } from './FilterChips';
import { AdvancedFilterPanel } from './AdvancedFilterPanel';
import { SavedFilters } from './SavedFilters';
import { QuickFilters } from './QuickFilters';
import { SearchResults } from './SearchResults';
import { LoadingSpinner } from '../Shared';
import { Copy, Bookmark } from 'lucide-react';

interface AdvancedSearchProps {
  submissions: Submission[];
  users: User[];
  usersMap?: Record<string, User>;
  onSubmissionClick: (submission: Submission) => void;
  selectedIds?: Set<string>;
  isSelectionMode?: boolean;
  onToggleSelect?: (id: string) => void;
  onSelectAll?: (ids: string[]) => void;
}

export function AdvancedSearch({
  submissions,
  users,
  usersMap,
  onSubmissionClick,
  selectedIds,
  isSelectionMode,
  onToggleSelect,
  onSelectAll,
}: AdvancedSearchProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [page, setPage] = useState(1);
  const { searchText, setSearchText, filters, setFilters, results, clearAll: clearSearch } = useSearch(submissions);
  const { savedFilters, saveFilter, deleteFilter, togglePin } = useSavedFilters(user?.companyId || '');
  const { updateFilters: updateURLFilters, getShareURL } = useURLFilters();

  const categories = Array.from(new Set(submissions.map((s) => s.category)));
  const locations = Array.from(new Set(boards.flatMap((board) => board.locations || []))).sort();

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

  useEffect(() => {
    void Promise.resolve().then(() => setPage(1));
  }, [results.length, searchText]);

  const handleSaveFilter = async (name: string, description?: string) => {
    if (!user) return;
    try {
      setLoading(true);
      await saveFilter(name, filters, user.id, description);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyQuickFilter = useCallback((quickFilters: SearchFilters) => {
    setFilters(quickFilters);
    updateURLFilters(quickFilters);
    setPage(1);
  }, [setFilters, updateURLFilters]);

  const handleSelectSavedFilter = useCallback((filter: SavedFilter) => {
    setFilters(filter.filters);
    updateURLFilters(filter.filters);
    setPage(1);
    setShowSaved(false);
  }, [setFilters, updateURLFilters]);

  const handleCopyShareLink = () => {
    const url = getShareURL();
    navigator.clipboard.writeText(url);
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="space-y-4">

      {/* ── Toolbar: Search + Filters ── */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <SearchBar
            value={searchText}
            onChange={setSearchText}
            placeholder={t('advanced_search.placeholder')}
          />
        </div>

        <AdvancedFilterPanel
          boards={boards}
          users={users}
          categories={categories}
          locations={locations}
          filters={filters}
          onFiltersChange={(newFilters) => {
            setFilters(newFilters);
            updateURLFilters(newFilters);
            setPage(1);
          }}
          onSaveFilter={handleSaveFilter}
        />

        <button
          onClick={handleCopyShareLink}
          title={t('advanced_search.copy_link')}
          className="flex-shrink-0 p-2 rounded-lg bg-white border border-[#d6cabf] text-[#78716c] hover:text-[#c0694a] hover:border-[#c0694a] hover:bg-[#f5e6df] transition-all"
        >
          <Copy size={15} />
        </button>

        {savedFilters.length > 0 && (
          <button
            onClick={() => setShowSaved(!showSaved)}
            title={t('advanced_search.saved_filters')}
            className={`flex-shrink-0 p-2 rounded-lg border transition-all ${
              showSaved
                ? 'bg-[#FFF8E6] border-[#FFD77A] text-[#B06F00]'
                : 'bg-white border-[#d6cabf] text-[#78716c] hover:border-[#FFD77A] hover:text-[#B06F00]'
            }`}
          >
            <Bookmark size={15} />
          </button>
        )}
      </div>

      {/* ── Quick Filters row ── */}
      <QuickFilters onApply={handleApplyQuickFilter} userId={user?.id} />

      {/* ── Saved Filters (expandable) ── */}
      {showSaved && savedFilters.length > 0 && (
        <div className="bg-white border border-[#e9e0d9] rounded-xl p-4">
          <p className="text-xs font-bold text-[#78716c] uppercase tracking-wider mb-3">{t('advanced_search.saved_filters')}</p>
          <SavedFilters
            filters={savedFilters}
            onSelect={handleSelectSavedFilter}
            onDelete={deleteFilter}
            onTogglePin={togglePin}
          />
        </div>
      )}

      {/* ── Active filter chips ── */}
      {hasActiveFilters && (
        <FilterChips
          filters={filters}
          boards={boards}
          users={users}
          onRemoveStatus={(status) =>
            setFilters({ ...filters, status: filters.status?.filter((s) => s !== status) })
          }
          onRemovePriority={(priority) =>
            setFilters({ ...filters, priority: filters.priority?.filter((p) => p !== priority) })
          }
          onRemoveBoard={(boardId) =>
            setFilters({ ...filters, boardId: filters.boardId?.filter((b) => b !== boardId) })
          }
          onRemoveCategory={(category) =>
            setFilters({ ...filters, category: filters.category?.filter((c) => c !== category) })
          }
          onRemoveLocation={(location) =>
            setFilters({ ...filters, location: filters.location?.filter((item) => item !== location) })
          }
          onRemoveAssignee={() => setFilters({ ...filters, assignedTo: undefined })}
          onRemoveDateRange={() => setFilters({ ...filters, dateRange: undefined })}
          onClearAll={() => {
            setFilters({});
            updateURLFilters({});
            clearSearch();
            setPage(1);
          }}
        />
      )}

      {/* ── Results ── */}
      {loading ? (
        <LoadingSpinner size="lg" className="min-h-96" />
      ) : (
        <SearchResults
          results={results}
          onSubmissionClick={onSubmissionClick}
          usersMap={usersMap}
          page={page}
          pageSize={20}
          onPageChange={setPage}
          selectedIds={selectedIds}
          isSelectionMode={isSelectionMode}
          onToggleSelect={onToggleSelect}
          onSelectAll={onSelectAll}
        />
      )}
    </div>
  );
}
