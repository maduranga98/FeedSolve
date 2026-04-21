# Advanced Search & Filtering - Firestore Indexes

This document describes the Firestore indexes required for optimal performance of the advanced search and filtering system.

## Required Indexes

### 1. Submissions - Status + Board Filter
**Collection**: `submissions`
**Fields**:
- `companyId` (Ascending)
- `status` (Ascending)
- `boardId` (Ascending)
- `createdAt` (Descending)

**Use Case**: Filter submissions by status and board simultaneously

### 2. Submissions - Priority + Status Filter
**Collection**: `submissions`
**Fields**:
- `companyId` (Ascending)
- `priority` (Ascending)
- `status` (Ascending)
- `createdAt` (Descending)

**Use Case**: High-priority submissions that are unresolved

### 3. Submissions - Assigned + Status Filter
**Collection**: `submissions`
**Fields**:
- `companyId` (Ascending)
- `assignedTo` (Ascending)
- `status` (Ascending)
- `createdAt` (Descending)

**Use Case**: Submissions assigned to a specific person

### 4. Submissions - Board + Category + Status Filter
**Collection**: `submissions`
**Fields**:
- `companyId` (Ascending)
- `boardId` (Ascending)
- `category` (Ascending)
- `status` (Ascending)
- `createdAt` (Descending)

**Use Case**: Filter by board, category, and status

### 5. Submissions - Date Range Filter
**Collection**: `submissions`
**Fields**:
- `companyId` (Ascending)
- `createdAt` (Descending)
- `status` (Ascending)

**Use Case**: Recent submissions with status filtering

### 6. Saved Filters Collection
**Collection**: `companies/{companyId}/filters`
**Fields**:
- `createdAt` (Descending)
- `isPinned` (Descending)

**Use Case**: List saved filters with pinned items first

## Creating Indexes

### Option 1: Firebase Console
1. Go to Firestore Database → Indexes
2. Click "Create Index"
3. Select collection and add fields in the specified order
4. Mark fields as Ascending (Asc) or Descending (Desc) as specified

### Option 2: Firestore Rules (firestore.rules)
Indexes can be defined in the firestore.json file:

```json
{
  "indexes": [
    {
      "collectionId": "submissions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "companyId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "boardId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    }
  ]
}
```

### Option 3: Firebase CLI
Deploy indexes from firebase.json:
```bash
firebase deploy --only firestore:indexes
```

## Performance Notes

- **Composite indexes** are created automatically for simple filters but are recommended for complex queries
- **Single field indexes** (automatic): `status`, `priority`, `boardId`, `category`, `assignedTo`, `createdAt`
- **Date range queries** benefit from index on `createdAt` + `companyId`

## Full-Text Search Considerations

Firestore does not support native full-text search. The current implementation:
1. Retrieves documents matching filter criteria
2. Performs client-side full-text search
3. This works well for datasets < 10,000 documents

### For Large Datasets (> 10,000 documents)
Consider implementing Algolia integration:
1. Sync submissions to Algolia on create/update
2. Use Algolia API for full-text search
3. Return filtered results back to client

## Query Optimization Tips

1. **Always filter by `companyId` first** - reduces dataset size
2. **Use `in` operator for multiple values** instead of multiple `where` clauses
3. **Sort last** - apply pagination after sorting
4. **Limit results** - always use pagination (default 50 per page)

## Example Queries

### Get High Priority Unresolved
```typescript
query(submissions,
  where('companyId', '==', companyId),
  where('priority', 'in', ['high', 'critical']),
  where('status', 'in', ['received', 'in_review', 'in_progress']),
  orderBy('createdAt', 'desc'),
  limit(50)
)
```

### Get Recent by Board and Category
```typescript
query(submissions,
  where('companyId', '==', companyId),
  where('boardId', '==', boardId),
  where('category', 'in', [...]),
  orderBy('createdAt', 'desc')
)
```

## Index Status

Check index status in Firebase Console:
- **Status**: Shows "Enabled", "Building", or "Error"
- **Size**: Indexed data size (impacts storage costs)
- **Usage**: How often the index is queried

## Maintenance

- **Monitor index usage** via Firebase Analytics
- **Delete unused indexes** to reduce storage costs
- **Update indexes** if query patterns change

## Testing

Before deploying to production:
1. Test queries in Firestore Emulator
2. Monitor query latency
3. Verify index usage statistics
4. Check storage impact
