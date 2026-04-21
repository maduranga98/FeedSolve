# FeedSolve Cloud Functions

This directory contains Google Cloud Functions for FeedSolve webhooks integration.

## Structure

- `src/webhooks.ts` - Main webhook event handlers and notification functions
- `src/index.ts` - Function exports

## Functions

### `handleSubmissionEvent`
Triggers when a submission is created or updated in Firestore. Sends notifications to configured webhooks.

**Trigger:** `onWrite` on `submissions/{submissionId}`

**Supported Events:**
- `submission.created`
- `submission.updated`
- `submission.assigned`
- `submission.reply_added`
- `submission.resolved`

### `testWebhook`
Tests a webhook connection by sending a test event.

**Trigger:** HTTPS callable

**Parameters:**
- `companyId: string` - Company ID
- `webhookType: 'slack' | 'email' | 'custom'` - Type of webhook to test

## Development

### Setup

```bash
cd functions
npm install
npm run watch  # Watch for changes
```

### Build

```bash
npm run build
```

### Deploy

```bash
firebase deploy --only functions
```

### Local Testing

```bash
firebase emulators:start --only functions

# In another terminal:
firebase functions:shell
testWebhook({ companyId: "test-id", webhookType: "slack" })
```

### View Logs

```bash
firebase functions:log
firebase functions:log --follow  # Real-time
```

## Webhook Payload Structure

### Slack
Sends formatted Slack message blocks to configured webhook URL.

### Email
Sends HTML email to configured recipients.

### Custom
Sends JSON payload with HMAC signature:

```json
{
  "event": "submission.created",
  "timestamp": "2024-03-20T14:32:15.000Z",
  "data": {
    "submission": {
      "id": "sub-123",
      "trackingCode": "FSV-001",
      "subject": "Bug report",
      "description": "App crashes on login",
      "status": "received",
      "priority": "high",
      "category": "Bug",
      "createdAt": "2024-03-20T14:32:15.000Z"
    }
  }
}
```

Header: `X-FeedSolve-Signature` contains HMAC SHA-256 signature

## Error Handling

All webhook sends include:
- Automatic retry logic (max 3 retries)
- Exponential backoff delays
- Detailed error logging
- Failure tracking and alerts

Failed webhooks are logged in Firestore:
```
/webhook_logs/{companyId}/logs/{logId}
```

## Security

- Webhook URLs and secrets are encrypted before storage
- Custom webhooks signed with HMAC SHA-256
- Firestore rules restrict webhook logs access to company admins
- Cloud Functions can only write logs, not read them

## Monitoring

Monitor function health in Firebase Console:
- Execution count
- Error count
- P50/P95/P99 latency
- Billed duration

Set alerts for:
- Error rate > 5%
- P95 latency > 10s
- Function timeouts

## Troubleshooting

### Function Not Triggering

1. Check Firestore collection permissions
2. Verify Cloud Functions are deployed
3. Check function logs: `firebase functions:log`
4. Ensure submissions have required fields

### Slow Webhook Delivery

1. Check network latency to webhook endpoints
2. Review Cloud Functions execution time
3. Check for quota limits (Firestore writes)

### Webhook Signature Invalid

1. Verify secret matches between FeedSolve and your endpoint
2. Check that payload is not modified
3. Ensure HMAC algorithm is SHA-256

## Dependencies

- `firebase-admin` - Firebase Admin SDK
- `firebase-functions` - Cloud Functions SDK
- `axios` - HTTP client
- `crypto` - HMAC signing

## Environment Variables

Set in Firebase Console or via `gcloud`:

```bash
firebase functions:config:set slack.webhook_url="xxx"
firebase functions:config:set email.provider="brevo"
```

Access in functions:
```typescript
const config = functions.config();
const webhookUrl = config.slack.webhook_url;
```

## Rate Limiting

Cloud Functions are subject to:
- 540 requests/minute per function
- 9 concurrent invocations per function
- 25 MB max payload size

Custom webhooks may have additional rate limits from the endpoint.

## Testing

See `../WEBHOOK_TESTING.md` for comprehensive testing guide.

## Contributing

1. Make changes in `src/`
2. Build: `npm run build`
3. Test locally: `firebase emulators:start`
4. Deploy: `firebase deploy --only functions`
