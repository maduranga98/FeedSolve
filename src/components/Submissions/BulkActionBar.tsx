import { useState } from 'react';
import { X } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  totalCount?: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onStatusChange?: () => void;
  onPriorityChange?: () => void;
  onAssign?: () => void;
  onCategoryChange?: () => void;
  onDelete?: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function BulkActionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onStatusChange,
  onPriorityChange,
  onAssign,
  onCategoryChange,
  onDelete,
  onClose,
  isLoading = false,
}: BulkActionBarProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen || selectedCount === 0) {
    return null;
  }

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-blue-50 border-t border-blue-200 px-6 py-4 shadow-lg z-40">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <span className="font-semibold text-blue-900">
            {selectedCount} selected
            {totalCount && ` of ${totalCount}`}
          </span>

          {selectedCount < (totalCount || 0) && (
            <button
              onClick={onSelectAll}
              disabled={isLoading}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed underline"
            >
              Select all
            </button>
          )}

          {selectedCount > 0 && (
            <button
              onClick={onDeselectAll}
              disabled={isLoading}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed underline"
            >
              Deselect all
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onStatusChange && (
            <button
              onClick={onStatusChange}
              disabled={isLoading}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Change Status
            </button>
          )}

          {onPriorityChange && (
            <button
              onClick={onPriorityChange}
              disabled={isLoading}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Change Priority
            </button>
          )}

          {onAssign && (
            <button
              onClick={onAssign}
              disabled={isLoading}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Assign To
            </button>
          )}

          {onCategoryChange && (
            <button
              onClick={onCategoryChange}
              disabled={isLoading}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Add to Category
            </button>
          )}

          {onDelete && (
            <button
              onClick={onDelete}
              disabled={isLoading}
              className="px-4 py-2 bg-red-50 text-red-700 border border-red-300 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Delete
            </button>
          )}

          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
