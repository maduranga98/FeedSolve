# Public Resolution Feed Aggregation

Phase 2 uses client-side aggregation for `/r/:companySlug`:

1. Look up the company by `companySlug`.
2. Stop if `showPublicFeed` is not enabled.
3. Fetch up to 1,000 recent submissions for all-time and monthly summary metrics.
4. Fetch the last 10 resolved submissions ordered by `resolvedAt` for the anonymized activity timeline.
5. Render only aggregate numbers plus category and resolution duration.

Required composite indexes are tracked in `firestore.indexes.json`:

- `submissions`: `companyId ASC`, `createdAt DESC`
- `submissions`: `companyId ASC`, `status ASC`, `resolvedAt DESC`

## Future Option B: pre-aggregated stats

For higher-volume accounts and stricter public data isolation, replace the browser aggregation with a scheduled Cloud Function that writes a public stats document such as `companies/{companyId}/publicStats/current` once per day or on submission status changes. That document should contain only public-safe fields:

- all-time resolution rate
- all-time resolved count
- average resolution time
- active board count
- this-month received/resolved counts and rate
- last 10 anonymized activity entries containing category and resolution duration only

The public route would then read the company public settings plus the public stats document, avoiding public reads of raw submission documents.
