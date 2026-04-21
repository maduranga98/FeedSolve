import { formatFileSize } from '../../lib/attachments-config';

interface FileProgressBarProps {
  filename: string;
  progress: number; // 0-100
  totalBytes: number;
  uploadedBytes: number;
  error?: string;
}

export function FileProgressBar({
  filename,
  progress,
  totalBytes,
  uploadedBytes,
  error,
}: FileProgressBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <p className="text-color-primary font-medium truncate">{filename}</p>
        <p className="text-color-muted-text text-xs">
          {formatFileSize(uploadedBytes)} / {formatFileSize(totalBytes)}
        </p>
      </div>

      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${error ? 'bg-color-error' : 'bg-color-accent'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {error && <p className="text-xs text-color-error">{error}</p>}
    </div>
  );
}
