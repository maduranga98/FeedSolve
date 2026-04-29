import { useState, useCallback } from 'react';
import { uploadAttachment } from '../lib/firestore';
import { ATTACHMENT_CONFIG } from '../lib/attachments-config';

interface UploadProgress {
  fileId: string;
  filename: string;
  progress: number;
  totalBytes: number;
  uploadedBytes: number;
  error?: string;
  retryCount: number;
}

interface UseFileUploadReturn {
  uploads: Map<string, UploadProgress>;
  uploading: boolean;
  uploadFiles: (submissionId: string, files: File[]) => Promise<void>;
  cancelUpload: (fileId: string) => void;
  clearUploads: () => void;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

export function useFileUpload(): UseFileUploadReturn {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());
  const [uploading, setUploading] = useState(false);
  const abortControllers = new Map<string, AbortController>();

  const updateProgress = useCallback((fileId: string, progress: Partial<UploadProgress>) => {
    setUploads((prev) => {
      const updated = new Map(prev);
      const current = updated.get(fileId) || { retryCount: 0 };
      updated.set(fileId, { ...current, ...progress, fileId } as UploadProgress);
      return updated;
    });
  }, []);

  const delay = useCallback((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)), []);

  const uploadSingleFile = useCallback(
    async (submissionId: string, file: File, fileId: string): Promise<boolean> => {
      let retryCount = 0;

      while (retryCount < MAX_RETRIES) {
        try {
          updateProgress(fileId, {
            filename: file.name,
            progress: 0,
            totalBytes: file.size,
            uploadedBytes: 0,
            retryCount,
          });

          // Simulate progress for base64 encoding
          updateProgress(fileId, { progress: 25 });
          await delay(200);

          const result = await uploadAttachment(submissionId, file);

          if (!result.success) {
            throw new Error(result.error || 'Upload failed');
          }

          updateProgress(fileId, {
            progress: 100,
            uploadedBytes: file.size,
          });

          return true;
        } catch (error: any) {
          retryCount++;
          const errorMsg = error.message || 'Upload failed';

          if (retryCount < MAX_RETRIES) {
            updateProgress(fileId, {
              error: `${errorMsg}. Retrying...`,
              retryCount,
            });
            await delay(RETRY_DELAY * retryCount);
          } else {
            updateProgress(fileId, {
              error: `${errorMsg} (Failed after ${MAX_RETRIES} attempts)`,
              retryCount,
            });
          }
        }
      }

      return false;
    },
    [updateProgress, delay]
  );

  const uploadFiles = useCallback(
    async (submissionId: string, files: File[]) => {
      if (uploading) return;
      if (files.length === 0) return;

      setUploading(true);

      try {
        // Validate total size
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        if (totalSize > ATTACHMENT_CONFIG.maxSubmissionSize) {
          throw new Error('Total file size exceeds submission limit');
        }

        // Upload files sequentially to avoid overloading the endpoint
        const results: boolean[] = [];
        for (let i = 0; i < files.length; i++) {
          const fileId = `${Date.now()}-${i}-${Math.random()}`;
          const ok = await uploadSingleFile(submissionId, files[i], fileId);
          results.push(ok);
        }

        if (!results.every((r) => r)) {
          throw new Error('Some files failed to upload. Please try re-uploading the failed files.');
        }
      } catch (error: any) {
        setUploading(false);
        throw error;
      }
      setUploading(false);
    },
    [uploading, uploadSingleFile]
  );

  const cancelUpload = useCallback((fileId: string) => {
    const controller = abortControllers.get(fileId);
    if (controller) {
      controller.abort();
      abortControllers.delete(fileId);
    }

    setUploads((prev) => {
      const updated = new Map(prev);
      updated.delete(fileId);
      return updated;
    });
  }, []);

  const clearUploads = useCallback(() => {
    setUploads(new Map());
  }, []);

  return {
    uploads,
    uploading,
    uploadFiles,
    cancelUpload,
    clearUploads,
  };
}
