# FeedSolve REST API Guide

Welcome to the FeedSolve REST API documentation. This guide will help you get started with integrating FeedSolve into your application.

## Table of Contents

- [Authentication](#authentication)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Code Examples](#code-examples)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

## Authentication

The FeedSolve API uses API Keys for authentication. All API requests must include your API key in the `Authorization` header.

### Getting Your API Key

1. Go to your Developer Dashboard at `/developer`
2. Click "Create New Key"
3. Give your key a descriptive name
4. Select the permissions you need
5. Copy the key and store it securely (shown only once)

### API Key Format

API keys follow this format: `fsk_` + 32 random characters

Example: `fsk_5c8d9e2f1a4b7c6e9f2a3b4c5d6e7f8a`

## Getting Started

### Installation

For JavaScript/TypeScript projects, use the built-in API client:

```javascript
import { APIClient } from './lib/api-client';

const client = new APIClient({
  apiKey: 'fsk_your_api_key_here',
  baseUrl: 'https://api.feedsolve.com'
});
```

### Making Your First Request

```javascript
// Create a submission
const submission = await client.submissions.create({
  boardId: 'board_123',
  subject: 'Bug report',
  description: 'Login page is broken',
  email: 'user@example.com'
});

console.log(submission);
// Output:
// {
//   id: 'sub_456',
//   trackingCode: '#FSV-7891',
//   status: 'received',
//   createdAt: '2024-03-20T14:30:00Z'
// }
```

## API Reference

### Submissions

#### Create Submission (Public)

```javascript
await client.submissions.create({
  boardId: string;
  category?: string;
  subject: string;
  description: string;
  email?: string;
  isAnonymous?: boolean;
});
```

**Response:**
```json
{
  "id": "sub_456",
  "trackingCode": "#FSV-7891",
  "status": "received",
  "createdAt": "2024-03-20T14:30:00Z"
}
```

#### Get Submission

```javascript
await client.submissions.get('tracking_code');
```

**Response:**
```json
{
  "id": "sub_456",
  "trackingCode": "#FSV-7891",
  "status": "in_review",
  "category": "Bug Report",
  "subject": "Login page broken",
  "publicReply": "We're investigating this issue",
  "createdAt": "2024-03-20T14:30:00Z",
  "updatedAt": "2024-03-20T15:00:00Z"
}
```

#### List Submissions

```javascript
await client.submissions.list({
  status: 'received',
  boardId: 'board_123',
  priority: 'high',
  limit: 10,
  offset: 0
});
```

**Query Parameters:**
- `status`: `received` | `in_review` | `in_progress` | `resolved` | `closed`
- `boardId`: Filter by board
- `priority`: `low` | `medium` | `high` | `critical`
- `limit`: 1-100 (default: 10)
- `offset`: For pagination (default: 0)

#### Update Submission

```javascript
await client.submissions.update('submission_id', {
  status: 'in_progress',
  priority: 'high',
  assignedTo: 'user_123',
  publicReply: 'We are working on this',
  internalNotes: 'Database migration required'
});
```

#### Delete Submission

```javascript
await client.submissions.delete('submission_id');
```

### Boards

#### Create Board

```javascript
await client.boards.create({
  name: 'Customer Feedback',
  description: 'Collect customer feedback',
  categories: ['Bug', 'Feature Request'],
  isAnonymousAllowed: true
});
```

#### Get Board

```javascript
await client.boards.get('board_id');
```

#### List Boards

```javascript
await client.boards.list();
```

#### Update Board

```javascript
await client.boards.update('board_id', {
  name: 'Updated Name',
  description: 'Updated description'
});
```

#### Delete Board

```javascript
await client.boards.delete('board_id');
```

### Analytics

#### Get Company Stats

```javascript
await client.analytics.getCompanyStats();
```

**Response:**
```json
{
  "totalSubmissions": 1234,
  "resolutionRate": 92.5,
  "avgResolutionDays": 2.3,
  "submissionsByStatus": {
    "received": 10,
    "in_review": 15,
    "in_progress": 20,
    "resolved": 1000,
    "closed": 189
  },
  "submissionsByBoard": {
    "board_123": 500,
    "board_456": 734
  },
  "submissionsByPriority": {
    "low": 100,
    "medium": 500,
    "high": 400,
    "critical": 234
  }
}
```

#### Get Board Stats

```javascript
await client.analytics.getBoardStats('board_id');
```

### API Keys

#### Create API Key

```javascript
await client.apiKeys.create({
  name: 'Production Integration',
  permissions: ['submissions:read', 'submissions:write'],
  expiresAt: '2025-03-20',
  ipWhitelist: ['203.0.113.45']
});
```

#### List API Keys

```javascript
await client.apiKeys.list();
```

#### Delete API Key

```javascript
await client.apiKeys.delete('key_id');
```

### Account

#### Get Current User Info

```javascript
await client.account.getCurrentUser();
```

**Response:**
```json
{
  "companyId": "company_123",
  "companyName": "Acme Corp",
  "tier": "business"
}
```

#### Get Company Info

```javascript
await client.account.getCompanyInfo();
```

## Code Examples

### Creating Multiple Submissions

```javascript
const submissions = [
  {
    boardId: 'board_123',
    subject: 'Bug: Page not loading',
    description: 'The dashboard page takes too long to load'
  },
  {
    boardId: 'board_123',
    subject: 'Feature: Dark mode',
    description: 'Please add dark mode support'
  },
  {
    boardId: 'board_456',
    subject: 'Question: API limits',
    description: 'What are the API rate limits?'
  }
];

for (const submission of submissions) {
  try {
    const result = await client.submissions.create(submission);
    console.log(`Created: ${result.trackingCode}`);
  } catch (error) {
    console.error('Failed to create submission:', error);
  }
}
```

### Fetching and Updating Submissions

```javascript
// Get all submitted feedback
const submissions = await client.submissions.list({ status: 'received' });

// Process each submission
for (const submission of submissions.submissions) {
  // Update status and add reply
  await client.submissions.update(submission.id, {
    status: 'in_review',
    publicReply: 'Thank you for your feedback! We are reviewing your submission.'
  });
}
```

### Getting Analytics

```javascript
// Get company stats
const stats = await client.analytics.getCompanyStats();

console.log(`Total submissions: ${stats.totalSubmissions}`);
console.log(`Resolution rate: ${stats.resolutionRate}%`);

// Get board-specific stats
const boardStats = await client.analytics.getBoardStats('board_123');
console.log(`Submissions for board: ${boardStats.totalSubmissions}`);
```

### Using with React

```jsx
import { useApiData } from './hooks/useApi';
import { APIClient } from './lib/api-client';

function SubmissionsList() {
  const { data, isLoading, error } = useApiData(
    (client) => client.submissions.list({ status: 'received' })
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.submissions.map((sub) => (
        <li key={sub.id}>{sub.subject}</li>
      ))}
    </ul>
  );
}
```

### Using with cURL

```bash
# Create a submission
curl -X POST https://api.feedsolve.com/api/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "boardId": "board_123",
    "subject": "Bug report",
    "description": "Login is broken"
  }'

# Get company stats (requires API key)
curl -X GET https://api.feedsolve.com/api/company/stats \
  -H "Authorization: Bearer fsk_your_api_key_here"

# Update submission
curl -X PATCH https://api.feedsolve.com/api/submissions/sub_456 \
  -H "Authorization: Bearer fsk_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "priority": "high"
  }'
```

### Using with Python

```python
import requests
import json

API_KEY = 'fsk_your_api_key_here'
BASE_URL = 'https://api.feedsolve.com'
HEADERS = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

# Create submission
submission_data = {
    'boardId': 'board_123',
    'subject': 'Bug report',
    'description': 'Login page broken',
    'email': 'user@example.com'
}

response = requests.post(
    f'{BASE_URL}/api/submissions',
    json=submission_data
)

result = response.json()
print(f"Created submission: {result['trackingCode']}")

# List submissions
response = requests.get(
    f'{BASE_URL}/api/company/submissions',
    headers=HEADERS,
    params={'status': 'received', 'limit': 10}
)

submissions = response.json()
print(f"Found {submissions['total']} submissions")
```

## Error Handling

All API errors include an error message and HTTP status code.

```javascript
try {
  await client.submissions.get('invalid_id');
} catch (error) {
  console.log(error.statusCode);  // 404
  console.log(error.message);      // "Submission not found"
  console.log(error.response);     // Full error response
}
```

### Common Error Responses

| Status | Error | Meaning |
|--------|-------|---------|
| 400 | Invalid input | Missing or incorrect request parameters |
| 401 | Invalid API key | API key is missing or invalid |
| 403 | IP not whitelisted | Your IP is not in the whitelist |
| 404 | Not found | Resource not found |
| 429 | Rate limit exceeded | Monthly request limit reached |
| 500 | Internal error | Server error (try again later) |

## Rate Limiting

The API has rate limits based on your plan:

- **Business Tier**: 10,000 requests/month (~333/day, ~14/hour)

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9845
X-RateLimit-Reset: 1703510400
```

### Checking Your Usage

```javascript
// Get current usage
const stats = await client.analytics.getCompanyStats();
console.log(`Used: ${stats.totalRequests} / 10000`);
```

## Webhooks (Coming Soon)

Webhooks allow you to receive real-time updates when submissions are created or updated. Coming in Week 8!

## Support

- **Documentation**: https://feedsolve.com/docs
- **Email**: support@feedsolve.com
- **Discord**: https://discord.gg/feedsolve
- **GitHub Issues**: https://github.com/maduranga98/feedsolve/issues
