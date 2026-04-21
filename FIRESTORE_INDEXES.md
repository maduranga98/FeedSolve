# Firestore Composite Indexes

For optimal query performance, the following composite indexes must be created in Firebase Console.

## Required Indexes

### submissions Collection

#### Index 1: Company Submissions (Recent)
- **Collection:** submissions
- **Fields:**
  1. companyId (Ascending)
  2. createdAt (Descending)
- **Query Pattern:** Used in `getCompanySubmissions()`
- **Purpose:** Efficiently fetch all submissions for a company ordered by most recent

#### Index 2: Board Submissions (Recent)
- **Collection:** submissions
- **Fields:**
  1. boardId (Ascending)
  2. createdAt (Descending)
- **Query Pattern:** Used in `getBoardSubmissions()`
- **Purpose:** Efficiently fetch all submissions for a board ordered by most recent

#### Index 3: Company Submissions by Status
- **Collection:** submissions
- **Fields:**
  1. companyId (Ascending)
  2. status (Ascending)
  3. createdAt (Descending)
- **Query Pattern:** Filter by company and status
- **Purpose:** For future status filtering features

#### Index 4: Board Submissions by Status
- **Collection:** submissions
- **Fields:**
  1. boardId (Ascending)
  2. status (Ascending)
  3. createdAt (Descending)
- **Query Pattern:** Filter board submissions by status
- **Purpose:** For future status filtering features

### bulkOperations Collection

#### Index 5: Bulk Operations by Company
- **Collection:** bulkOperations
- **Fields:**
  1. companyId (Ascending)
  2. createdAt (Descending)
- **Query Pattern:** Used to list bulk operations for a company
- **Purpose:** Efficiently fetch all bulk operations for a company ordered by most recent

#### Index 6: Bulk Operations by Status
- **Collection:** bulkOperations
- **Fields:**
  1. companyId (Ascending)
  2. status (Ascending)
  3. createdAt (Descending)
- **Query Pattern:** Filter bulk operations by company and status
- **Purpose:** Track pending, processing, completed, and failed operations

### bulkOperationLogs Collection

#### Index 7: Bulk Operation Logs by Company
- **Collection:** bulkOperationLogs
- **Fields:**
  1. companyId (Ascending)
  2. createdAt (Descending)
- **Query Pattern:** Audit trail for bulk operations
- **Purpose:** Efficiently fetch audit logs for bulk operations

## How to Create These Indexes

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your FeedSolve project
3. Navigate to **Firestore Database** > **Indexes** > **Composite Indexes**
4. Click **Create Index**
5. Fill in the collection name and field configuration
6. Click **Create**

Firebase will automatically prompt you to create indexes when you run queries that require them.

## Performance Impact

With these indexes:
- ✅ Query response time: <100ms (vs. slow for large datasets)
- ✅ Reduced database read operations
- ✅ Better user experience with faster page loads
- ✅ Scalable to millions of submissions

## Monitoring

After creating indexes:
1. Go to **Firestore Database** > **Stats**
2. Monitor "Index entries" to ensure indexes are being used
3. Check "Read operations" to verify performance improvements
