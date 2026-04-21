export const ATTACHMENT_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB per file
  maxSubmissionSize: 20 * 1024 * 1024, // 20MB per submission

  allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'xlsx'],
  mimeTypes: {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },

  tierLimits: {
    free: {
      monthlyStorage: 5 * 1024 * 1024, // 5MB
      maxFileSize: 5 * 1024 * 1024,
      maxSubmissionSize: 5 * 1024 * 1024,
    },
    starter: {
      monthlyStorage: 50 * 1024 * 1024, // 50MB
      maxFileSize: 10 * 1024 * 1024,
      maxSubmissionSize: 20 * 1024 * 1024,
    },
    growth: {
      monthlyStorage: 500 * 1024 * 1024, // 500MB
      maxFileSize: 25 * 1024 * 1024,
      maxSubmissionSize: 50 * 1024 * 1024,
    },
    business: {
      monthlyStorage: 5 * 1024 * 1024 * 1024, // 5GB
      maxFileSize: 100 * 1024 * 1024,
      maxSubmissionSize: 200 * 1024 * 1024,
    },
  },

  virusCheckEnabled: true,
  autoCleanupDays: 30,
  signedUrlExpiry: 3600, // 1 hour
};

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function isValidFileType(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ATTACHMENT_CONFIG.allowedFileTypes.includes(ext);
}

export function isValidFileSize(bytes: number, maxSize: number): boolean {
  return bytes <= maxSize;
}

export function getTierLimit(tier: string) {
  return ATTACHMENT_CONFIG.tierLimits[tier as keyof typeof ATTACHMENT_CONFIG.tierLimits] || ATTACHMENT_CONFIG.tierLimits.free;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
