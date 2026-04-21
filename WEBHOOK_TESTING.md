# Webhook Testing Guide

This document outlines testing procedures for the FeedSolve webhook system.

## Unit Testing

### Testing Webhook Configuration

```typescript
import { test } from 'vitest';
import { updateSlackWebhook, getCompanyWebhooks } from '@/lib/webhooks';

test('should save Slack webhook configuration', async () => {
  const config = {
    enabled: true,
    webhookUrl: 'https://hooks.slack.com/services/...',
    events: ['submission.created'],
    format: 'detailed',
    mentionOnNew: false,
    connectedAt: new Date(),
  };

  await updateSlackWebhook('test-company', config);
  const webhooks = await getCompanyWebhooks('test-company');

  expect(webhooks.slack).toEqual(config);
});
```

### Testing Cloud Functions

```typescript
import { test } from 'vitest';
import { handleSubmissionEvent } from '../functions/src/webhooks';

test('should process submission.created event', async () => {
  const submission = {
    id: 'test-123',
    companyId: 'test-company',
    subject: 'Test',
    description: 'Test submission',
    status: 'received',
    // ... other fields
  };

  const change = {
    before: { exists: false },
    after: { data: () => submission },
  };

  await handleSubmissionEvent(change, { params: { submissionId: 'test-123' } });
  
  // Verify logs were created
  const logs = await getWebhookLogs('test-company');
  expect(logs.length).toBeGreaterThan(0);
});
```

## Integration Testing

### 1. Test Slack Integration

#### Setup
1. Create a test Slack workspace
2. Create a test channel
3. Create an Incoming Webhook for the channel

#### Test Flow
```
1. Go to FeedSolve Integrations page
2. Click "Add Slack Integration"
3. Enter webhook URL
4. Select "submission.created" event
5. Click "Save & Connect"
6. Click "Send Test"
7. Verify message appears in Slack channel
```

#### Validation Checklist
- [ ] Slack connection established
- [ ] Test message format is correct
- [ ] Channel mentioned (if enabled)
- [ ] Message contains all required info:
  - [ ] Subject
  - [ ] Tracking code
  - [ ] Category
  - [ ] Priority
  - [ ] Status

### 2. Test Email Integration

#### Setup
1. Configure email provider (Brevo/SendGrid)
2. Add test email addresses

#### Test Flow
```
1. Go to FeedSolve Integrations page
2. Click "Add Email Integration"
3. Enter test email address
4. Select "submission.created" event
5. Choose "Instant" frequency
6. Click "Save"
7. Click "Send Test"
8. Check test email received
```

#### Validation Checklist
- [ ] Email received within 1 minute
- [ ] Subject line is correct
- [ ] Email body contains:
  - [ ] Submission subject
  - [ ] Description
  - [ ] Status
  - [ ] Category
  - [ ] Link to submission
- [ ] HTML formatting is correct

### 3. Test Custom Webhook

#### Setup
1. Set up a webhook testing service:

```bash
# Using requestbin.com (online testing)
# Or locally with ngrok:
npx ngrok http 3000

# Create a simple server:
npm install express
```

```typescript
import express from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.json());

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-feedsolve-signature'];
  const secret = process.env.WEBHOOK_SECRET;
  
  // Verify signature
  const payload = JSON.stringify(req.body);
  const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  
  if (hash !== signature) {
    return res.status(401).send('Unauthorized');
  }
  
  console.log('Webhook received:', req.body);
  res.json({ success: true });
});

app.listen(3000, () => console.log('Webhook server running on 3000'));
```

#### Test Flow
```
1. Start your webhook server
2. Get your public URL (ngrok)
3. Go to FeedSolve Integrations page
4. Click "Add Custom Webhook"
5. Enter your webhook URL
6. Generate a secret
7. Copy the secret to your server
8. Select events
9. Click "Save"
10. Click "Send Test"
11. Verify webhook received in server
```

#### Validation Checklist
- [ ] Webhook request received
- [ ] Signature verified correctly
- [ ] Payload contains:
  - [ ] event: "submission.created"
  - [ ] timestamp: ISO 8601 format
  - [ ] data.submission with full details
- [ ] Response status is 200

## Event Testing

### Test All Events

```typescript
const events = [
  'submission.created',
  'submission.updated',
  'submission.assigned',
  'submission.reply_added',
  'submission.resolved',
];

for (const event of events) {
  // Create/update submission to trigger event
  // Verify webhook log created
  // Check status is 'success'
}
```

### Test Event Filtering

1. Set up a webhook for only 'submission.created'
2. Create multiple submissions
3. Update a submission (different event)
4. Verify only creation event triggered webhook
5. Check logs show only 1 webhook sent

## Retry Logic Testing

### Test Failure and Retry

1. Create a custom webhook with unreachable URL
2. Trigger a submission event
3. Wait for initial failure
4. Check webhook logs show:
   - [ ] Status: "failed"
   - [ ] errorMessage: connection error
   - [ ] retryCount: 0

5. Update the webhook URL to valid endpoint
6. Monitor logs for retry attempts
7. Verify successful retry

### Test Max Retries

1. Set webhook endpoint to return 500
2. Trigger submission event
3. Monitor logs for:
   - [ ] Initial attempt fails (retryCount: 0)
   - [ ] Retry 1 (retryCount: 1)
   - [ ] Retry 2 (retryCount: 2)
   - [ ] Retry 3 (retryCount: 3)
   - [ ] Give up (status: "failed", retryCount: 3)

## Performance Testing

### Load Testing

```bash
# Create 100 submissions rapidly
for i in {1..100}; do
  # Create submission via API
  curl -X POST http://localhost:3000/api/submissions \
    -H "Content-Type: application/json" \
    -d '{"subject":"Test","description":"Test"}'
done

# Monitor:
# - Cloud Functions execution time
# - Firestore write performance
# - Webhook delivery speed
# - Log generation
```

### Monitor Metrics

- Cloud Functions execution time: < 1 second
- Webhook delivery latency: < 5 seconds
- Log write success rate: > 99.9%

## Security Testing

### Test Authorization

```typescript
// 1. Try to view logs as different company
// Expected: Should fail

// 2. Try to modify webhook as non-admin
// Expected: Should fail

// 3. Try to access webhook logs without auth
// Expected: Should fail with 401
```

### Test Signature Verification

```typescript
const payload = { event: 'test', data: {} };
const secret = 'test-secret';

// Correct signature
const correctSig = crypto
  .createHmac('sha256', secret)
  .update(JSON.stringify(payload))
  .digest('hex');

// Invalid signature
const invalidSig = 'invalid';

// Test verification
expect(verifySignature(payload, correctSig, secret)).toBe(true);
expect(verifySignature(payload, invalidSig, secret)).toBe(false);
```

## UI Testing

### Test Integrations Dashboard

```typescript
import { render, screen } from '@testing-library/react';
import { IntegrationsPage } from '@/pages/Integrations/IntegrationsPage';

test('should display integrations dashboard', () => {
  render(<IntegrationsPage />);
  
  expect(screen.getByText(/Integrations/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Slack/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Email/i })).toBeInTheDocument();
});
```

### Test Setup Forms

```typescript
test('should validate Slack URL', async () => {
  const { getByPlaceholderText, getByText } = render(<SlackSetup onSave={jest.fn()} />);
  
  const input = getByPlaceholderText(/webhook url/i);
  fireEvent.change(input, { target: { value: 'invalid' } });
  fireEvent.click(getByText(/Save/i));
  
  expect(screen.getByText(/Invalid Slack webhook URL/i)).toBeInTheDocument();
});
```

## Deployment Testing

### Pre-deployment Checklist

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Cloud Functions build successfully
- [ ] No TypeScript errors
- [ ] Firestore rules validated
- [ ] Environment variables set
- [ ] Email provider configured
- [ ] Slack app installed

### Post-deployment Checklist

- [ ] Cloud Functions deployed
- [ ] Firestore rules deployed
- [ ] Frontend builds and runs
- [ ] Can access /integrations route
- [ ] Can create Slack webhook
- [ ] Can create Email webhook
- [ ] Can create Custom webhook
- [ ] Test webhooks work
- [ ] Logs appear in Firestore
- [ ] No errors in Cloud Functions logs

## Monitoring

### Set Up Alerts

1. Firebase Console → Functions → Alerts
   - Function failures
   - High execution time

2. Slack Channel Integration
   - Post errors to #alerts channel
   - Daily webhook summary

3. Email Alerts
   - Daily failure rate > 5%
   - No events in 24 hours

### Key Metrics to Monitor

- Webhook delivery success rate (target: > 99%)
- Average delivery time (target: < 5s)
- Retry success rate (target: > 90%)
- Error types and frequencies
- Storage usage (webhook logs)
