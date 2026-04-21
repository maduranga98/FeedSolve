# Webhook Deployment Guide

This guide covers the deployment and setup of FeedSolve webhooks.

## Prerequisites

- Firebase project set up with Firestore
- Firebase CLI installed (`npm install -g firebase-tools`)
- Node.js 18+

## Deployment Steps

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 2. Set Firebase Project

```bash
firebase use feedsolve-prod
```

Update the project ID in `.firebaserc` if needed.

### 3. Deploy Cloud Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 4. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 5. Install Frontend Dependencies

```bash
npm install
```

## Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Slack Integration Setup

1. Create a Slack App at https://api.slack.com/apps
2. Enable Incoming Webhooks
3. Create a new webhook for your workspace
4. Copy the webhook URL to use in FeedSolve

### Email Integration Setup

For email integration, you can use:
- **Firebase Extensions** (Brevo)
- **SendGrid**
- **Brevo** (formerly Sendinblue)

Update the Cloud Functions with your email provider credentials.

### Custom Webhook Setup

For custom webhooks, you'll need:
1. A publicly accessible endpoint
2. A shared secret for HMAC signature verification

## Testing Webhooks

### Manual Testing

1. Go to the Integrations page in FeedSolve
2. Set up a webhook (Slack, Email, or Custom)
3. Click "Send Test" to verify connectivity

### Cloud Function Testing

```bash
firebase functions:shell

# In the shell:
testWebhook({ companyId: "your_company_id", webhookType: "slack" })
```

### Webhook Logs

Monitor webhook execution in Firestore:
- Collection: `webhook_logs/{companyId}/logs`
- Fields: `status`, `webhookType`, `event`, `errorMessage`, `retryCount`

## Troubleshooting

### Cloud Functions Not Deploying

- Check Node.js version: `node --version` (should be 18+)
- Check `functions/package.json` dependencies
- View logs: `firebase functions:log`

### Webhooks Not Triggering

1. Check if webhooks are enabled for the company
2. Verify event types are selected
3. Check firestore rules allow Cloud Functions to write logs
4. Review logs in `webhook_logs/{companyId}/logs`

### Slack Webhook Errors

- Verify webhook URL is correct
- Check if the Slack workspace still has the app installed
- Verify the app has permission to post to the channel

### Email Not Sending

- Verify email provider credentials
- Check sender email is verified
- Review email provider rate limits
- Check logs for errors

## Monitoring

### Real-time Monitoring

Watch Cloud Functions logs in real-time:

```bash
firebase functions:log --follow
```

### Webhook Statistics

Check webhook stats in company document:
- `webhookStats.totalSent`: Total webhooks sent
- `webhookStats.failureCount`: Number of failures
- `webhookStats.lastEventAt`: Last webhook event timestamp
- `webhookStats.nextRetryAt`: When next retry is scheduled

## Rollback

If you need to rollback:

```bash
# Disable all webhooks
firebase firestore:delete companies/* --recursive

# Or rollback specific functions
firebase functions:delete handleSubmissionEvent
```

## Production Checklist

- [ ] All environment variables set
- [ ] Slack app installed and webhook URL configured
- [ ] Email provider configured
- [ ] Firestore rules deployed
- [ ] Cloud Functions deployed
- [ ] Test webhooks working
- [ ] Error handling verified
- [ ] Retry logic tested
- [ ] Logs retention policy configured
- [ ] Monitoring alerts set up

## Support

For issues, check:
1. Cloud Functions logs: `firebase functions:log`
2. Webhook logs in Firestore
3. Browser console for frontend errors
4. Firebase Console for quota/billing issues
