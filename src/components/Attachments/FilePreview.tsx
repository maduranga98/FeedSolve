import { File, X, Loader2 } from 'lucide-react';
import { formatFileSize } from '../../lib/attachments-config';

interface FileItem {
  name: string;
  size: number;
  id?: string;
}

interface FilePreviewProps {
  files: FileItem[];
  onRemove: (fileId: string | number) => void;
  isUploading?: boolean;
}

export function FilePreview({ files, onRemove, isUploading = false }: FilePreviewProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-color-primary">Attached Files ({files.length})</p>
      <div className="space-y-2">
        {files.map((file, index) => (
          <div
            key={file.id || index}
            className="flex items-center justify-between p-3 bg-gray-50 border border-color-border rounded-md"
          >
            <div className="flex items-center gap-3 flex-1">
              <File size={20} className="text-color-accent flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-color-primary truncate">{file.name}</p>
                <p className="text-xs text-color-muted-text">{formatFileSize(file.size)}</p>
              </div>
            </div>

            <button
              onClick={() => onRemove(file.id || index)}
              disabled={isUploading}
              className="p-1 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
              aria-label={`Remove ${file.name}`}
            >
              {isUploading ? (
                <Loader2 size={18} className="text-color-accent animate-spin" />
              ) : (
                <X size={18} className="text-color-error" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
