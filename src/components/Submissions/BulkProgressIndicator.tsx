import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface BulkProgressIndicatorProps {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedCount: number;
  totalCount: number;
  operationType: string;
  errorMessage?: string;
  onDismiss?: () => void;
}

export function BulkProgressIndicator({
  status,
  processedCount,
  totalCount,
  operationType,
  errorMessage,
  onDismiss,
}: BulkProgressIndicatorProps) {
  const progress = Math.round((processedCount / totalCount) * 100);
  const isProcessing = status === 'processing';
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';

  const getStatusIcon = () => {
    if (isCompleted) return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
    if (isFailed) return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
    if (isProcessing) return <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />;
    return null;
  };

  const getBackgroundColor = () => {
    if (isCompleted) return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
    if (isFailed) return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
    return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
  };

  const getTextColor = () => {
    if (isCompleted) return 'text-green-900 dark:text-green-200';
    if (isFailed) return 'text-red-900 dark:text-red-200';
    return 'text-blue-900 dark:text-blue-200';
  };

  return (
    <div className={`border rounded-lg p-4 ${getBackgroundColor()}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">{getStatusIcon()}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <p className={`font-semibold ${getTextColor()}`}>
              {operationType}
            </p>
            <p className={`text-sm ${getTextColor()}`}>
              {processedCount} of {totalCount}
            </p>
          </div>

          {isProcessing && (
            <div className="mb-3">
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">{progress}% complete</p>
            </div>
          )}

          {isCompleted && (
            <p className="text-sm text-green-700 dark:text-green-300">
              Successfully updated {processedCount} submission{processedCount !== 1 ? 's' : ''}
            </p>
          )}

          {isFailed && (
            <div>
              <p className="text-sm text-red-700 dark:text-red-300 mb-1">
                Operation failed after {processedCount} of {totalCount} submissions
              </p>
              {errorMessage && (
                <p className="text-sm text-red-600 dark:text-red-400 font-mono bg-red-100 dark:bg-red-900 rounded px-2 py-1">
                  {errorMessage}
                </p>
              )}
            </div>
          )}
        </div>

        {!isProcessing && onDismiss && (
          <button
            onClick={onDismiss}
            className={`text-sm font-medium hover:underline ${
              isFailed
                ? 'text-red-600 dark:text-red-400 hover:text-red-800 hover:dark:text-red-200'
                : 'text-green-600 dark:text-green-400 hover:text-green-800 hover:dark:text-green-200'
            }`}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
