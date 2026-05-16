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

        // Fetch as blob so the browser honors the desired filename
        // (cross-origin URLs ignore the `download` attribute otherwise).
        const response = await fetch(result.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch file (${response.status})`);
        }
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = attachment.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
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
