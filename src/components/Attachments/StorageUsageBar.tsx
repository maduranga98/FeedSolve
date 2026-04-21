import { AlertCircle } from 'lucide-react';
import { formatFileSize } from '../../lib/attachments-config';

interface StorageUsageBarProps {
  usedBytes: number;
  totalBytes: number;
  tierName?: string;
}

export function StorageUsageBar({ usedBytes, totalBytes, tierName }: StorageUsageBarProps) {
  const percentageUsed = Math.min((usedBytes / totalBytes) * 100, 100);
  const isNearLimit = percentageUsed >= 80;
  const isExceeded = usedBytes > totalBytes;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-color-primary">Storage Usage</p>
          {tierName && <p className="text-xs text-color-muted-text">{tierName} Tier</p>}
        </div>
        <p className={`text-sm font-medium ${isExceeded ? 'text-color-error' : 'text-color-primary'}`}>
          {formatFileSize(usedBytes)} / {formatFileSize(totalBytes)}
        </p>
      </div>

      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            isExceeded ? 'bg-color-error' : isNearLimit ? 'bg-yellow-500' : 'bg-color-accent'
          }`}
          style={{ width: `${Math.min(percentageUsed, 100)}%` }}
        />
      </div>

      <div className="flex items-start gap-2">
        <p className={`text-xs ${isExceeded ? 'text-color-error' : 'text-color-muted-text'}`}>
          {percentageUsed.toFixed(1)}% used
        </p>
        {isNearLimit && (
          <div className="flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
            <AlertCircle size={14} />
            Storage limit approaching
          </div>
        )}
        {isExceeded && (
          <div className="flex items-center gap-1 text-xs text-color-error bg-red-50 px-2 py-1 rounded">
            <AlertCircle size={14} />
            Storage limit exceeded
          </div>
        )}
      </div>
    </div>
  );
}
