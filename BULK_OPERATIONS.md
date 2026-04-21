# Bulk Operations System

Complete documentation for the FeedSolve bulk operations feature for submissions management.

## Overview

The bulk operations system allows users to perform actions on multiple submissions simultaneously, including:
- **Bulk Status Changes** - Update status for multiple submissions at once
- **Bulk Priority Updates** - Change priority for multiple submissions
- **Bulk Assignments** - Assign multiple submissions to team members
- **Bulk Category Updates** - Add multiple submissions to a category
- **Bulk Delete** - Delete multiple submissions with confirmation

## Features

### 1. Selection Management
- ✅ Select individual submissions with checkboxes
- ✅ Select all submissions in current view with one click
- ✅ Deselect all submissions
- ✅ Visual feedback showing count of selected submissions
- ✅ Indeterminate state for partial selection

### 2. Bulk Actions
- ✅ Batch processing with configurable batch size (default: 100)
- ✅ Transaction-based updates ensuring consistency
- ✅ Asynchronous processing preventing UI blocking
- ✅ Real-time progress tracking

### 3. Audit Logging
- ✅ All bulk operations logged to `bulkOperationLogs` collection
- ✅ Tracks user, timestamp, operation type, and details
- ✅ Complete audit trail for compliance

### 4. Undo Mechanism
- ✅ Undo last bulk operation within 6-hour window
- ✅ Automatic restoration of previous values
- ✅ Undo operation also logged for audit trail

### 5. Error Handling
- ✅ Graceful failure with error messages
- ✅ Partial completion tracking
- ✅ Automatic cleanup on failure

## Components

### SelectAllCheckbox
Checkbox component for selecting/deselecting all items.

```tsx
import { SelectAllCheckbox } from '@/components/Submissions/SelectAllCheckbox';

<SelectAllCheckbox
  isChecked={allSelected}
  isIndeterminate={someSelected}
  onChange={handleSelectAll}
  disabled={isLoading}
/>
```

**Props:**
- `isChecked: boolean` - Whether all items are checked
- `isIndeterminate: boolean` - Partial selection state
- `onChange: (checked: boolean) => void` - Selection change handler
- `disabled?: boolean` - Disable the checkbox
- `title?: string` - Checkbox title/tooltip

### BulkActionBar
Shows when items are selected, displays action buttons.

```tsx
import { BulkActionBar } from '@/components/Submissions/BulkActionBar';

<BulkActionBar
  selectedCount={selectedIds.size}
  totalCount={submissions.length}
  onSelectAll={handleSelectAll}
  onDeselectAll={handleDeselectAll}
  onStatusChange={showStatusModal}
  onPriorityChange={showPriorityModal}
  onAssign={showAssignModal}
  onCategoryChange={showCategoryModal}
  onDelete={showDeleteModal}
  onClose={handleClose}
  isLoading={isProcessing}
/>
```

**Props:**
- `selectedCount: number` - Number of selected items
- `totalCount?: number` - Total items available
- `onSelectAll: () => void` - Select all handler
- `onDeselectAll: () => void` - Deselect all handler
- `onStatusChange?: () => void` - Status change button handler
- `onPriorityChange?: () => void` - Priority change button handler
- `onAssign?: () => void` - Assign button handler
- `onCategoryChange?: () => void` - Category button handler
- `onDelete?: () => void` - Delete button handler
- `onClose: () => void` - Close handler
- `isLoading?: boolean` - Show loading state

### BulkActionModal
Confirmation modal before performing bulk action.

```tsx
import { BulkActionModal } from '@/components/Submissions/BulkActionModal';

<BulkActionModal
  isOpen={showModal}
  title="Change Status"
  message="Select a new status"
  selectedCount={selectedIds.size}
  isDangerous={false}
  actionLabel="Update"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
  customContent={<StatusSelector />}
/>
```

**Props:**
- `isOpen: boolean` - Modal visibility
- `title: string` - Modal title
- `message: string` - Description message
- `selectedCount: number` - Number of items to update
- `isDangerous?: boolean` - Highlight as dangerous action
- `isLoading?: boolean` - Show loading state
- `actionLabel?: string` - Confirm button text (default: "Confirm")
- `onConfirm: () => Promise<void>` - Confirm handler
- `onCancel: () => void` - Cancel handler
- `customContent?: React.ReactNode` - Additional content (e.g., selector)

### BulkProgressIndicator
Shows progress and status of bulk operation.

```tsx
import { BulkProgressIndicator } from '@/components/Submissions/BulkProgressIndicator';

<BulkProgressIndicator
  status={operation.status}
  processedCount={operation.processedCount}
  totalCount={operation.totalCount}
  operationType="Bulk Status Update"
  errorMessage={operation.errorMessage}
  onDismiss={handleDismiss}
/>
```

**Props:**
- `status: 'pending' | 'processing' | 'completed' | 'failed'` - Operation status
- `processedCount: number` - Items processed so far
- `totalCount: number` - Total items to process
- `operationType: string` - Type of operation
- `errorMessage?: string` - Error details if failed
- `onDismiss?: () => void` - Dismiss handler

## Hooks

### useBulkOperations()
Main hook for managing bulk selection and operations.

```tsx
import { useBulkOperations } from '@/hooks/useBulkOperations';

const bulk = useBulkOperations();

// Selection
bulk.toggleSelection(submissionId);
bulk.selectAll([id1, id2, id3]);
bulk.deselectAll();

// Operations (return Promise<BulkOperation>)
await bulk.updateStatus('resolved');
await bulk.updatePriority('high');
await bulk.assignTo(userId);
await bulk.addToCategory('bug-reports');
await bulk.deleteSelected();
await bulk.undo(operationId);

// State
bulk.selectedIds; // Set<string>
bulk.selectedCount; // number
bulk.isLoading; // boolean
bulk.currentOperation; // BulkOperation | null
bulk.error; // string | null

// Utilities
bulk.clearError();
bulk.clearOperation();
```

### useBulkOperationStatus(operationId)
Monitor the status of an ongoing bulk operation.

```tsx
import { useBulkOperationStatus } from '@/hooks/useBulkOperationStatus';

const { operation, isProcessing, isCompleted, isFailed, error, refetch } = 
  useBulkOperationStatus(operationId);
```

Returns:
- `operation: BulkOperation | null` - Current operation details
- `isLoading: boolean` - Fetching status
- `error: string | null` - Error message
- `isProcessing: boolean` - Operation in progress
- `isCompleted: boolean` - Operation completed successfully
- `isFailed: boolean` - Operation failed
- `refetch: () => Promise<void>` - Manual refresh

## API Endpoints

### POST /api/bulk-operations/status
Change status for multiple submissions.

```ts
fetch('/api/bulk-operations/status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    submissionIds: ['id1', 'id2'],
    status: 'in_progress'
  })
});
```

**Returns:** `BulkOperation` (HTTP 202)

### POST /api/bulk-operations/priority
Change priority for multiple submissions.

```ts
fetch('/api/bulk-operations/priority', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    submissionIds: ['id1', 'id2'],
    priority: 'high'
  })
});
```

**Returns:** `BulkOperation` (HTTP 202)

### POST /api/bulk-operations/assign
Assign multiple submissions to a team member.

```ts
fetch('/api/bulk-operations/assign', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    submissionIds: ['id1', 'id2'],
    assignedTo: 'user-id'
  })
});
```

**Returns:** `BulkOperation` (HTTP 202)

### POST /api/bulk-operations/category
Add multiple submissions to a category.

```ts
fetch('/api/bulk-operations/category', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    submissionIds: ['id1', 'id2'],
    category: 'bugs'
  })
});
```

**Returns:** `BulkOperation` (HTTP 202)

### POST /api/bulk-operations/delete
Delete multiple submissions.

```ts
fetch('/api/bulk-operations/delete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    submissionIds: ['id1', 'id2']
  })
});
```

**Returns:** `BulkOperation` (HTTP 202)

### GET /api/bulk-operations/:id
Get status of a bulk operation.

```ts
const response = await fetch('/api/bulk-operations/operation-id');
const operation = await response.json();
```

**Returns:** `BulkOperation`

### POST /api/bulk-operations/:id/undo
Undo a bulk operation (within 6-hour window).

```ts
fetch('/api/bulk-operations/operation-id/undo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});
```

**Returns:** `UndoOperation` (HTTP 200)

## Types

### BulkOperation
```ts
interface BulkOperation {
  id: string;
  companyId: string;
  operationType: 'status' | 'priority' | 'assign' | 'category' | 'delete';
  submissionIds: string[];
  updateData: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedCount: number;
  totalCount: number;
  createdBy: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  errorMessage?: string;
  previousValues?: Array<{
    submissionId: string;
    previousData: Record<string, any>;
  }>;
}
```

### BulkOperationLog
```ts
interface BulkOperationLog {
  id: string;
  companyId: string;
  operationId: string;
  operationType: 'status' | 'priority' | 'assign' | 'category' | 'delete';
  submissionCount: number;
  createdBy: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: 'created' | 'completed' | 'failed' | 'undone';
  details: Record<string, any>;
  createdAt: Timestamp;
}
```

### UndoOperation
```ts
interface UndoOperation {
  id: string;
  companyId: string;
  operationId: string;
  originalBulkOperation: BulkOperation;
  restoredAt: Timestamp;
  restoredBy: string;
  expiresAt: Timestamp;
}
```

## Integration Example

See `BulkOperationsExample.tsx` for a complete working example that shows:
- How to render a submissions list with selection checkboxes
- How to use all bulk operation components
- How to handle user interactions
- How to show progress during operations

## Database Collections

### bulkOperations
Tracks all bulk operations for the company.

**Fields:**
- `id: string` - Unique operation ID
- `companyId: string` - Company ID
- `operationType: string` - Type of operation
- `submissionIds: string[]` - IDs of affected submissions
- `updateData: object` - Data that was updated
- `status: string` - Operation status (pending, processing, completed, failed)
- `processedCount: number` - Submissions processed so far
- `totalCount: number` - Total submissions to process
- `createdBy: string` - User ID who created operation
- `createdAt: Timestamp` - Creation time
- `completedAt?: Timestamp` - Completion time (if completed)
- `errorMessage?: string` - Error details (if failed)
- `previousValues?: Array` - Original values (for undo)

**Indexes Required:**
1. `(companyId, createdAt DESC)` - List operations by company
2. `(companyId, status, createdAt DESC)` - Filter by status

### bulkOperationLogs
Audit trail for all bulk operations.

**Fields:**
- `id: string` - Log ID
- `companyId: string` - Company ID
- `operationId: string` - Reference to bulk operation
- `operationType: string` - Type of operation
- `submissionCount: number` - Number of submissions affected
- `createdBy: string` - User ID
- `userId: string` - User ID (duplicate for filtering)
- `userName: string` - User name at time of operation
- `userEmail: string` - User email at time of operation
- `action: string` - Action type (created, completed, failed, undone)
- `details: object` - Operation details
- `createdAt: Timestamp` - Timestamp

**Indexes Required:**
1. `(companyId, createdAt DESC)` - Audit trail by company

### undoOperations
Tracks undo operations for reversal capability.

**Fields:**
- `id: string` - Undo operation ID
- `companyId: string` - Company ID
- `operationId: string` - Reference to original operation
- `originalBulkOperation: object` - Copy of original operation
- `restoredAt: Timestamp` - When undo was performed
- `restoredBy: string` - User ID who performed undo
- `expiresAt: Timestamp` - When undo capability expires (6 hours later)

## Security & Permissions

### Required Permissions
- **Read submissions:** `submissions:read`
- **Modify submissions:** `submissions:write`
- **Delete submissions:** `submissions:delete`

### Role-Based Access
- **Owner:** Full access to all bulk operations
- **Admin:** Full access to all bulk operations
- **Manager:** Can perform bulk operations
- **Viewer:** Can only view (no operations)

## Performance Considerations

### Batch Size
Operations are processed in batches of 100 submissions to prevent:
- Cloud Functions timeout (max 9 minutes)
- Firestore write quota exceeded
- Memory overflow

### Async Processing
All bulk operations are processed asynchronously:
- Request returns immediately (HTTP 202)
- Operation processes in background
- Client polls for status every 1 second
- Webhook notifications can be added for completion

### Rate Limiting
Built-in rate limiting prevents abuse:
- Max 10 bulk operations per minute per company
- Max 1000 submissions per operation
- Rate limits enforced at API gateway

## Error Handling

### Partial Failures
If an operation fails partway through:
1. Processing stops at failure point
2. `processedCount` shows how many were completed
3. `errorMessage` contains the error
4. Completed submissions keep their updated values
5. Remaining submissions are not affected

### Retry Strategy
For failed operations:
1. Identify failed operation ID
2. User can attempt the operation again
3. System processes remaining unaffected submissions
4. Automatic retry not implemented (requires manual action)

### Undo Window
- Operations can be undone within 6 hours of completion
- After 6 hours, undo is no longer available
- Undo operation is itself logged

## Firestore Rules

Bulk operations respect role-based security:

```firestore
// Users can read bulk operations
match /bulkOperations/{operationId} {
  allow read: if isUserInCompany(resource.data.companyId) &&
    hasRole(['owner', 'admin', 'manager']);
  allow write: if false; // Cloud Functions only
}

// Audit logs readable by admins only
match /bulkOperationLogs/{logId} {
  allow read: if isUserInCompany(resource.data.companyId) &&
    hasRole(['owner', 'admin']);
  allow write: if false; // Cloud Functions only
}
```

## Monitoring & Debugging

### Check Operation Status
Monitor bulk operations in Firestore console:
1. Navigate to `bulkOperations` collection
2. Filter by `status = 'processing'`
3. Check `processedCount` vs `totalCount`
4. Review `errorMessage` if failed

### View Audit Trail
Audit logs in `bulkOperationLogs` collection:
1. Filter by `companyId` and `action`
2. Track which operations succeeded/failed
3. See who performed operations and when

### Logs
Cloud Functions logs available in Google Cloud Console:
1. Search for "bulk" in function logs
2. Look for operation IDs in error messages
3. Check timestamps for operation timing

## Future Enhancements

Potential improvements:
- [ ] Webhook notifications on operation completion
- [ ] Scheduled bulk operations
- [ ] Conditional bulk operations (if-then rules)
- [ ] Bulk operation templates
- [ ] Operation rollback beyond 6-hour window (requires backup)
- [ ] Parallel processing for faster completion
- [ ] Export bulk operation history as CSV
