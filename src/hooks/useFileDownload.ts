import { useState, useCallback } from 'react';
import { downloadAttachment } from '../lib/firestore';
import type { FileAttachment } from '../types';

interface UseFileDownloadReturn {
  loading: string;
  error: string;
  downloadFile: (submissionId: string, attachment: FileAttachment) => Promise<void>;
  viewFile: (submissionId: string, attachment: FileAttachment) => Promise<{ url: string } | undefined>;
}

export function useFileDownload(): UseFileDownloadReturn {
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  const downloadFile = useCallback(
    async (submissionId: string, attachment: FileAttachment) => {
      try {
        setLoading(attachment.id);
        setError('');

        const result = await downloadAttachment(submissionId, attachment.id);

        if (!result.success || !result.url) {
          throw new Error(result.error || 'Failed to download file');
        }

        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = result.url;
        link.download = attachment.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Download failed';
        setError(errorMsg);
        console.error('Download error:', err);
      } finally {
        setLoading('');
      }
    },
    []
  );

  const viewFile = useCallback(
    async (submissionId: string, attachment: FileAttachment): Promise<{ url: string } | undefined> => {
      try {
        setLoading(attachment.id);
        setError('');

        const result = await downloadAttachment(submissionId, attachment.id);
        if (!result.success || !result.url) {
          throw new Error(result.error || 'Failed to open file');
        }

        window.open(result.url, '_blank', 'noopener,noreferrer');
        return { url: result.url };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Open file failed';
        setError(errorMsg);
        console.error('View error:', err);
      } finally {
        setLoading('');
      }
    },
    []
  );

  return {
    loading,
    error,
    downloadFile,
    viewFile,
  };
}
