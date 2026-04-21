# FeedSolve Deployment Guide

## Overview
This guide covers deploying FeedSolve to production using Firebase Hosting and Cloud Functions.

---

## Prerequisites

```bash
# Install Firebase CLI
npm install -g firebase-tools@latest

# Authenticate
firebase login

# Verify installation
firebase --version
firebase projects:list
```

---

## Environment Setup

### 1. Production Environment Variables

Create `.env.production` with:

```bash
# Firebase
VITE_FIREBASE_API_KEY=your_production_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=feedsolve-prod
VITE_FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# App
VITE_APP_URL=https://feedsolve.com
VITE_ENVIRONMENT=production

# Services
VITE_SENTRY_DSN=https://...@sentry.io/...
VITE_STRIPE_PUBLIC_KEY=pk_live_...

# Stripe Price IDs
VITE_STRIPE_PRICE_STARTER_MONTHLY=price_...
VITE_STRIPE_PRICE_STARTER_ANNUAL=price_...
VITE_STRIPE_PRICE_GROWTH_MONTHLY=price_...
VITE_STRIPE_PRICE_GROWTH_ANNUAL=price_...
VITE_STRIPE_PRICE_BUSINESS_MONTHLY=price_...
VITE_STRIPE_PRICE_BUSINESS_ANNUAL=price_...
```

### 2. Firebase Configuration

```bash
# Select production project
firebase use feedsolve-prod

# Verify configuration
firebase projects:list
firebase projects:describe feedsolve-prod
```

---

## Deployment Process

### Step 1: Pre-Deployment Checks

```bash
# Clean build
npm run build

# Verify no errors
echo "Build exit code: $?"

# Check bundle size
ls -lah dist/

# Verify TypeScript
npm run lint

# Run tests (if available)
npm test
```

### Step 2: Frontend Deployment

```bash
# Deploy to Firebase Hosting only (faster for testing)
firebase deploy --only hosting --force

# Verify deployment
curl -I https://feedsolve.com

# Check deployment status
firebase hosting:versions:list
```

### Step 3: Backend Deployment

```bash
# Deploy Cloud Functions
firebase deploy --only functions

# Monitor deployment
firebase functions:log --limit 50

# Verify functions
firebase functions:describe sendWebhook
```

### Step 4: Full Deployment

```bash
# Deploy both frontend and backend
firebase deploy --force

# Verify all deployments
firebase deploy:list
```

---

## Deployment Variations

### Staging Deployment (Before Production)

```bash
# Use staging project
firebase use feedsolve-staging

# Deploy to staging
firebase deploy --only hosting

# Test thoroughly before production
# ...

# Switch back to production
firebase use feedsolve-prod
```

### Incremental Deployment

```bash
# Deploy just functions (if only backend changed)
firebase deploy --only functions:webhooks,functions:api

# Deploy just hosting (if only frontend changed)
firebase deploy --only hosting

# Useful when making frequent updates
```

### Rollback Deployment

```bash
# List previous versions
firebase hosting:versions:list

# Promote previous version
firebase hosting:versions:promote <VERSION_ID>

# Verify rollback
curl https://feedsolve.com
```

---

## Post-Deployment Verification

### Smoke Tests

```bash
# Check homepage loads
curl -I https://feedsolve.com
# Expected: HTTP/2 200

# Check API health
curl https://feedsolve.com/api/health
# Expected: {"status":"ok"}

# Check Firebase functions
firebase functions:describe sendWebhook
# Expected: deployed, healthy

# Check Firestore rules deployed
firebase rules:list
```

### Monitoring Checks

```bash
# Check Sentry is capturing errors
# - Visit Sentry dashboard
# - Look for recent events

# Check Firebase Analytics
# - Visit Firebase console
# - Check event count increased

# Check performance metrics
# - Run Lighthouse
# - Check Core Web Vitals
```

### User Testing

- [ ] Sign up works
- [ ] Create board works
- [ ] QR code generation works
- [ ] Feedback submission works
- [ ] Dashboard loads
- [ ] Analytics display correctly
- [ ] Webhooks trigger
- [ ] API endpoints respond

---

## Rollback Procedures

### Fast Rollback (< 5 minutes)

```bash
# Get previous version ID
firebase hosting:versions:list

# Promote previous version
firebase hosting:versions:promote <VERSION_ID>

# Verify rollback
curl -I https://feedsolve.com

# Monitor errors dropped
# Check Sentry error rate drops
# Check Firebase logs return to normal
```

### Code Rollback (Git)

```bash
# If deployment had code issues
git log --oneline | head -5

# Revert to previous commit
git revert HEAD

# Build and redeploy
npm run build
firebase deploy --only hosting --force
```

### Database Rollback

```bash
# Firestore has point-in-time recovery
# Use Firebase console to restore

# Restore from backup:
# 1. Go to Firebase Console > Firestore
# 2. Click "Manage backups"
# 3. Select previous backup
# 4. Click "Restore"
```

---

## Continuous Deployment (CI/CD)

### GitHub Actions Setup

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          projectId: feedsolve-prod
```

### Manual Deployment Trigger

```bash
# Deploy main branch
git checkout main
git pull origin main
npm run build
firebase deploy --force

# Or use GitHub Actions button in repo
```

---

## Performance Monitoring

### After Deployment

```bash
# Check Core Web Vitals
# Run in browser console:
// window.__VITALS_DATA__

# Check Lighthouse score
firebase hosting:logs:list

# Monitor performance degradation
# Use Sentry > Performance > Transactions
```

### Expected Performance

- Page load: < 3 seconds
- API response: < 200ms
- Function cold start: < 5 seconds
- Firestore query: < 100ms

---

## Troubleshooting

### Deployment Fails

```bash
# Check Firebase project is set
firebase projects:list

# Clear cache
rm -rf .firebase/

# Try again
firebase deploy --force

# Check logs
firebase deploy --debug
```

### Functions Not Deploying

```bash
# Check function syntax
npm run build:functions

# Check dependencies
cat functions/package.json

# Deploy with debug info
firebase deploy --only functions --debug
```

### Performance Issues After Deploy

```bash
# Check error rate
# Sentry > Issues

# Check database load
# Firebase Console > Firestore > Stats

# Check function performance
# Firebase Console > Cloud Functions

# If issues, rollback immediately
firebase hosting:versions:promote <PREVIOUS_VERSION>
```

---

## Deployment Schedule

**Recommended Deployment Window:** Monday 10am-12pm UTC

Reasons:
- Team available for issues
- Off-peak traffic (evening US, morning Europe)
- Time to monitor before peak hours
- Can still deploy hotfixes same day if needed

**Avoid:**
- Friday afternoon (no one available over weekend)
- Holiday periods
- During major events/announcements

---

## Deployment Checklist

Before each deployment:

- [ ] Code reviewed and merged
- [ ] All tests passing
- [ ] Bundle size checked
- [ ] Environment variables verified
- [ ] Sentry DSN set
- [ ] Firebase project correct
- [ ] Team notified
- [ ] Rollback plan ready

After deployment:

- [ ] Monitor error rate (first 5 minutes)
- [ ] Check page load time
- [ ] Verify API endpoints
- [ ] Test critical flows
- [ ] Check Sentry events
- [ ] Monitor for 1 hour

---

## Resources

- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [Cloud Functions Docs](https://firebase.google.com/docs/functions)
- [Deployment Best Practices](https://firebase.google.com/docs/hosting/best-practices)
- [Performance Optimization](https://web.dev/performance/)

---

**Last Updated:** 2026-04-21  
**Version:** 1.0  
**Status:** Pre-Launch
