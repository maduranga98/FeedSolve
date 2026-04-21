# FeedSolve File Attachment System

## Overview

A complete file attachment system for FeedSolve submissions with support for:
- Multi-file uploads with drag & drop
- File validation (type, size, quota)
- Upload progress tracking with retry logic
- Virus scanning integration
- Storage tier limits
- Signed URL downloads
- Automatic cleanup of orphaned files

## Architecture

### Components

#### 1. FileUploadInput
Drag-and-drop file input component with validation.
```tsx
<FileUploadInput
  onFilesSelected={handleFilesSelected}
  maxSize={5 * 1024 * 1024} // 5MB
  disabled={false}
  multiple={true}
/>
```

#### 2. FilePreview
Display selected files with remove button.
```tsx
<FilePreview
  files={selectedFiles}
  onRemove={handleRemove}
  isUploading={uploading}
/>
```

#### 3. FileProgressBar
Show upload progress for individual files.
```tsx
<FileProgressBar
  filename="document.pdf"
  progress={45}
  totalBytes={1000000}
  uploadedBytes={450000}
  error={null}
/>
```

#### 4. AttachmentGallery
Display submitted attachments with download functionality.
```tsx
<AttachmentGallery
  attachments={submission.attachments}
  onDownload={handleDownload}
  loading={downloading}
/>
```

#### 5. StorageUsageBar
Show tier storage usage visualization.
```tsx
<StorageUsageBar
  usedBytes={50000000}
  totalBytes={5000000000}
  tierName="Business"
/>
```

### Hooks

#### useFileUpload
Manages file upload state with retry logic.
```tsx
const {
  uploads,      // Map of upload progress by file ID
  uploading,    // Current upload status
  uploadFiles,  // Upload function
  cancelUpload, // Cancel specific upload
  clearUploads  // Clear all uploads
} = useFileUpload();
```

#### useFileDownload
Manages file download with signed URLs.
```tsx
const {
  loading,      // Current downloading file ID
  error,        // Download error
  downloadFile  // Download function
} = useFileDownload();
```

## Configuration

### Attachment Limits

**File Types** (configurable):
- jpg, jpeg, png (images)
- pdf (documents)
- doc, docx (Word documents)
- xlsx (Excel spreadsheets)

**File Sizes**:
```ts
maxFileSize: 5MB per file
maxSubmissionSize: 20MB per submission (configurable per tier)
```

**Storage Tiers**:
- **Free**: 5MB/month
- **Starter**: 50MB/month
- **Growth**: 500MB/month
- **Business**: 5GB/month

### Configuration File

Located at: `src/lib/attachments-config.ts`

```ts
export const ATTACHMENT_CONFIG = {
  maxFileSize: 5 * 1024 * 1024,
  maxSubmissionSize: 20 * 1024 * 1024,
  allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'xlsx'],
  tierLimits: {
    free: { monthlyStorage: 5 * 1024 * 1024, ... },
    starter: { monthlyStorage: 50 * 1024 * 1024, ... },
    growth: { monthlyStorage: 500 * 1024 * 1024, ... },
    business: { monthlyStorage: 5 * 1024 * 1024 * 1024, ... },
  },
  virusCheckEnabled: true,
  autoCleanupDays: 30,
  signedUrlExpiry: 3600, // 1 hour
};
```

## Backend APIs

### Upload File
```
POST /api/submissions/:submissionId/attachments
Content-Type: application/json

{
  "filename": "document.pdf",
  "filetype": "application/pdf",
  "filesize": 1024000,
  "base64data": "JVBERi0xLjQKJeLj..."
}

Response:
{
  "id": "uuid",
  "filename": "document.pdf",
  "fileSize": 1024000,
  "message": "File uploaded successfully"
}
```

### Download File
```
GET /api/submissions/:submissionId/attachments/:attachmentId/download

Response:
{
  "url": "https://storage.googleapis.com/signed-url...",
  "filename": "document.pdf"
}
```

### Delete File
```
DELETE /api/submissions/:submissionId/attachments/:attachmentId

Response:
{
  "message": "Attachment deleted"
}
```

## Firestore Schema

### Submission Document
```ts
{
  ...existing fields
  attachments?: [
    {
      id: string                // UUID
      filename: string          // Original filename
      fileType: string          // MIME type
      fileSize: number          // File size in bytes
      storagePath: string       // Firebase Storage path
      uploadedAt: Timestamp
      uploadedBy: string        // User ID
      scanned?: boolean
      scanStatus?: 'pending' | 'clean' | 'infected'
    }
  ]
}
```

### Company Usage
```ts
{
  ...existing fields
  usage: {
    ...existing usage fields
    storage?: {
      totalBytes: number        // Tier limit
      usedBytes: number         // Current usage
      lastResetAt: Timestamp    // Monthly reset date
    }
  }
}
```

## Security

### Firestore Rules

```firestore
match /submissions/{submissionId} {
  // Company members can read attachments
  match /attachments/{attachmentId} {
    allow read: if canReadSubmissions(resource.data.companyId);
    allow write: if false; // Cloud Functions handle writes
  }
}

match /virus_scan_queue/{scanId} {
  allow read, write: if false; // Cloud Functions only
}
```

### Storage Security

- **Signed URLs**: 1-hour expiry for downloads
- **Bucket Rules**: Must implement GCS bucket rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /attachments/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if false; // Cloud Functions only
    }
  }
}
```

## Cloud Functions

### Upload Handler
- Validates file type and size
- Checks storage quota
- Uploads to Firebase Storage
- Updates submission document
- Updates storage usage

### Download Handler
- Verifies company membership
- Generates signed URL (1 hour expiry)
- Returns download link

### Virus Scanning
- Integrates with VirusTotal API
- Scans files asynchronously
- Updates scan status

### Cleanup Functions

#### Orphaned File Cleanup
Runs daily - deletes files not referenced in submissions (>30 days old).

#### Virus Scan Results Check
Runs every 5 minutes - polls VirusTotal API for results.

#### Monthly Storage Reset
Runs on 1st of each month at midnight UTC - resets monthly storage counter.

## Integration Guide

### 1. Add to Submission Form

```tsx
import { FileUploadInput, FilePreview, FileProgressBar } from '../../components/Attachments';
import { useFileUpload } from '../../hooks/useFileUpload';

export function SubmitFeedback() {
  const { uploads, uploadFiles, uploading } = useFileUpload();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submissionId, setSubmissionId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    // Create submission first
    const result = await createSubmission(...);
    setSubmissionId(result.id);

    // Upload files
    if (selectedFiles.length > 0) {
      await uploadFiles(result.id, selectedFiles);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... other form fields ... */}

      <FileUploadInput
        onFilesSelected={(files) => setSelectedFiles(prev => [...prev, ...files])}
        disabled={uploading}
      />

      {selectedFiles.length > 0 && (
        <FilePreview
          files={selectedFiles.map(f => ({ name: f.name, size: f.size }))}
          onRemove={(index) => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
          isUploading={uploading}
        />
      )}

      {uploads.size > 0 && (
        <div>
          {Array.from(uploads.values()).map(upload => (
            <FileProgressBar
              key={upload.fileId}
              filename={upload.filename}
              progress={upload.progress}
              totalBytes={upload.totalBytes}
              uploadedBytes={upload.uploadedBytes}
              error={upload.error}
            />
          ))}
        </div>
      )}

      <button type="submit" disabled={uploading}>
        {uploading ? 'Uploading Files...' : 'Submit Feedback'}
      </button>
    </form>
  );
}
```

### 2. Add to Submission Detail View

```tsx
import { AttachmentGallery } from '../../components/Attachments';
import { useFileDownload } from '../../hooks/useFileDownload';

export function SubmissionDetail() {
  const { loading, downloadFile } = useFileDownload();
  const [submission, setSubmission] = useState<Submission | null>(null);

  return (
    <div>
      {submission?.attachments && submission.attachments.length > 0 && (
        <AttachmentGallery
          attachments={submission.attachments}
          onDownload={(attachment) => downloadFile(submission.id, attachment)}
          loading={loading}
        />
      )}
    </div>
  );
}
```

### 3. Add Storage Usage Display

```tsx
import { StorageUsageBar } from '../../components/Attachments';
import { getTierLimit } from '../../lib/attachments-config';

export function Dashboard() {
  const [company, setCompany] = useState<Company>(null);

  const tierLimit = getTierLimit(company?.subscription.tier);
  const usedBytes = company?.usage?.storage?.usedBytes || 0;

  return (
    <StorageUsageBar
      usedBytes={usedBytes}
      totalBytes={tierLimit.monthlyStorage}
      tierName={company?.subscription.tier}
    />
  );
}
```

## Deployment

### Prerequisites

1. **Firebase Project Setup**
   - Enable Cloud Storage
   - Enable Cloud Functions

2. **Environment Variables** (functions/.env)
   ```
   VIRUSTOTAL_API_KEY=your_key_here
   ```

3. **Storage Rules** (firebase.json)
   ```json
   {
     "storage": [
       {
         "bucket": "your-bucket.appspot.com",
         "rules": "storage.rules"
       }
     ]
   }
```

### Deploy Cloud Functions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Deploy Storage Rules

```bash
firebase deploy --only storage
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "File type not allowed" | Invalid file extension | Check allowed types in config |
| "File exceeds max size" | File > 5MB | Split into multiple files |
| "Storage quota exceeded" | Tier limit reached | Upgrade tier or wait for monthly reset |
| "Upload failed - Retrying" | Network error | Automatic retry (3 attempts) |
| "Virus infection detected" | File flagged by VirusTotal | File blocked from download |

### Retry Logic

- **Max Retries**: 3 attempts
- **Backoff**: 1s, 2s, 4s between retries
- **Automatic**: Retries on network errors

## Monitoring

### Firestore Collections

- `virus_scan_queue`: Tracks pending virus scans
- `submissions`: View attachments field
- `companies`: Monitor storage usage in `usage.storage`

### Logs

Cloud Functions logs show:
- Upload success/failure
- Virus scan initiation
- Cleanup operations
- Storage usage updates

## Limitations

1. **Base64 Encoding**: Uses base64 for transport (33% size increase)
2. **Virus Scanning**: Requires VirusTotal API key and rate limits apply
3. **Signed URLs**: Expire after 1 hour (configurable)
4. **Monthly Reset**: Happens at UTC midnight on 1st of month

## Future Enhancements

- [ ] Chunked uploads for large files
- [ ] Resume interrupted uploads
- [ ] Image thumbnail generation
- [ ] Document preview
- [ ] Batch download as ZIP
- [ ] Upload progress webhooks
- [ ] File encryption at rest
- [ ] Bandwidth throttling
- [ ] CDN caching for downloads
