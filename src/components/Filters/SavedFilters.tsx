import { useState } from 'react';
import { Star, Trash2, Edit2 } from 'lucide-react';
import type { SavedFilter } from '../../types';
import { Button } from '../Shared';

interface SavedFiltersProps {
  filters: SavedFilter[];
  onSelect: (filter: SavedFilter) => void;
  onDelete: (filterId: string) => Promise<void>;
  onTogglePin: (filterId: string) => Promise<void>;
  loading?: boolean;
}

export function SavedFilters({
  filters,
  onSelect,
  onDelete,
  onTogglePin,
  loading = false,
}: SavedFiltersProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (filters.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[#6B7B8D] text-sm mb-2">No saved filters yet</p>
        <p className="text-[#9BACBA] text-xs">Create and save your custom filters to access them quickly</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filters.map((filter) => (
        <div
          key={filter.id}
          className="p-3 border border-[#D3D1C7] rounded-lg hover:bg-[#F8FAFB] transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <button
                onClick={() => onSelect(filter)}
                className="w-full text-left group"
              >
                <h4 className="font-medium text-[#444441] group-hover:text-[#2E86AB] truncate">
                  {filter.name}
                </h4>
              </button>
              {filter.description && (
                <p className="text-xs text-[#6B7B8D] mt-1 truncate">{filter.description}</p>
              )}
              <p className="text-xs text-[#9BACBA] mt-1">
                Saved by {filter.createdBy}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onTogglePin(filter.id)}
                disabled={loading}
                className="p-1 text-[#6B7B8D] hover:text-[#FFB703] transition-colors disabled:opacity-50"
                aria-label={filter.isPinned ? 'Unpin filter' : 'Pin filter'}
              >
                <Star
                  size={16}
                  className={filter.isPinned ? 'fill-[#FFB703]' : ''}
                />
              </button>

              <button
                onClick={() => onSelect(filter)}
                disabled={loading}
                className="p-1 text-[#6B7B8D] hover:text-[#2E86AB] transition-colors disabled:opacity-50"
                aria-label="Edit filter"
              >
                <Edit2 size={16} />
              </button>

              <button
                onClick={async () => {
                  setDeletingId(filter.id);
                  try {
                    await onDelete(filter.id);
                  } finally {
                    setDeletingId(null);
                  }
                }}
                disabled={loading || deletingId === filter.id}
                className="p-1 text-[#6B7B8D] hover:text-red-600 transition-colors disabled:opacity-50"
                aria-label="Delete filter"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
