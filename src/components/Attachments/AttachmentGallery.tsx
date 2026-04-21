import { File, Download, AlertCircle, Loader2 } from 'lucide-react';
import { formatFileSize } from '../../lib/attachments-config';
import { formatDate } from '../../lib/utils';
import type { FileAttachment } from '../../types';

interface AttachmentGalleryProps {
  attachments: FileAttachment[];
  onDownload: (attachment: FileAttachment) => Promise<void>;
  loading?: string;
}

export function AttachmentGallery({
  attachments,
  onDownload,
  loading = '',
}: AttachmentGalleryProps) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-color-primary mb-3">Attachments ({attachments.length})</h3>
      </div>

      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center justify-between p-4 bg-gray-50 border border-color-border rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-4 flex-1">
              <File size={24} className="text-color-accent flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-color-primary truncate">{attachment.filename}</p>
                <div className="flex items-center gap-4 text-xs text-color-muted-text mt-1">
                  <span>{formatFileSize(attachment.fileSize)}</span>
                  <span>{formatDate(new Date(attachment.uploadedAt.toMillis()))}</span>

                  {attachment.scanStatus && (
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded ${
                        attachment.scanStatus === 'clean'
                          ? 'bg-green-100 text-green-700'
                          : attachment.scanStatus === 'infected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {attachment.scanStatus === 'pending' && <Loader2 size={12} className="animate-spin" />}
                      {attachment.scanStatus === 'clean' && <span>✓ Safe</span>}
                      {attachment.scanStatus === 'infected' && <AlertCircle size={12} />}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => onDownload(attachment)}
              disabled={loading === attachment.id}
              className="p-2 ml-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 flex-shrink-0"
              aria-label={`Download ${attachment.filename}`}
            >
              {loading === attachment.id ? (
                <Loader2 size={20} className="text-color-accent animate-spin" />
              ) : (
                <Download size={20} className="text-color-accent" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
