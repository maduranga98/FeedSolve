import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface BulkActionModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  selectedCount: number;
  isDangerous?: boolean;
  isLoading?: boolean;
  actionLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  customContent?: React.ReactNode;
}

export function BulkActionModal({
  isOpen,
  title,
  message,
  selectedCount,
  isDangerous = false,
  isLoading = false,
  actionLabel = 'Confirm',
  onConfirm,
  onCancel,
  customContent,
}: BulkActionModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  };

  const isDisabled = isProcessing || isLoading;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          {isDangerous && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">This action cannot be undone immediately</p>
            </div>
          )}

          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>

          <p className="text-gray-600 mb-4">{message}</p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm font-medium text-blue-900">
              {selectedCount} submission{selectedCount !== 1 ? 's' : ''} will be affected
            </p>
          </div>

          {customContent && <div className="mb-4">{customContent}</div>}

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isDisabled}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDisabled}
              className={`flex-1 px-4 py-2 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isDangerous
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isProcessing ? 'Processing...' : actionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
