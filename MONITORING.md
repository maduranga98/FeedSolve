# FeedSolve Monitoring & Analytics Guide

## Overview
FeedSolve implements comprehensive monitoring across frontend and backend to track performance, errors, and user behavior.

---

## 1. Error Tracking (Sentry)

### 1.1 Setup

1. **Create Sentry Project**
   - Go to https://sentry.io
   - Create new project for React
   - Copy the DSN (Data Source Name)

2. **Configure Environment**
   ```bash
   # .env.local or .env.production
   VITE_SENTRY_DSN=https://...@sentry.io/...
   VITE_ENVIRONMENT=production
   ```

3. **Verify Setup**
   - Application should initialize Sentry on startup
   - Test with `throw new Error('Test error')` in console
   - Check Sentry dashboard for event

### 1.2 What Gets Tracked

**Automatically Captured:**
- ✅ JavaScript errors and exceptions
- ✅ React error boundaries
- ✅ Unhandled promise rejections
- ✅ Console errors
- ✅ Page navigation
- ✅ Performance metrics
- ✅ Session information

**Manually Captured:**
- ✅ Feature usage (trackFeatureUsage)
- ✅ Performance metrics (trackPerformanceMetric)
- ✅ API errors (monitorApiCall)
- ✅ Database errors (monitorDatabaseOperation)
- ✅ Custom events (trackEvent)

### 1.3 Usage Examples

```typescript
import { trackError, trackFeatureUsage, trackEvent } from './lib/monitoring';

// Track errors
try {
  await submitForm(data);
} catch (error) {
  trackError(error, { form: 'feedback', action: 'submit' });
}

// Track feature usage
trackFeatureUsage('SubmissionFilter', 'Applied');

// Track custom events
trackEvent({
  category: 'Conversion',
  action: 'Upgrade',
  label: 'Growth Plan',
  value: 4900, // cents
});
```

### 1.4 Sampling Strategy

- **Development:** 100% sampling (capture everything)
- **Production:** 10% sampling (captures 1 in 10 transactions)
- **Error Replays:** 100% sampling (always capture on error)
- **Session Replays:** 10% sampling

### 1.5 Data Privacy

**PII Protection:**
- ✅ No personal data captured by default
- ✅ Session replays mask text and media
- ✅ User email only in user context (on login)
- ✅ No password or payment data captured

**Data Retention:**
- Error events: 90 days
- Session replays: 30 days
- Performance data: 30 days

---

## 2. Performance Monitoring

### 2.1 Web Vitals Tracking

Core Web Vitals automatically tracked:
- **LCP** (Largest Contentful Paint): < 2.5s ✅
- **FID** (First Input Delay): < 100ms ✅
- **CLS** (Cumulative Layout Shift): < 0.1 ✅
- **FCP** (First Contentful Paint): < 1.8s ✅
- **TTFB** (Time to First Byte): < 600ms ✅

**Access Data:**
```typescript
// Data automatically stored in window.__VITALS_DATA__
const vitals = window.__VITALS_DATA__;
console.table(vitals);
```

### 2.2 Custom Performance Metrics

```typescript
import { trackPerformanceMetric, createPerformanceSpan } from './lib/monitoring';

// Simple metric tracking
trackPerformanceMetric('ApiCallTime', 145, 'ms');
trackPerformanceMetric('SubmissionCount', 1234, 'items');

// Performance spans
const span = createPerformanceSpan('DataLoad:submissions');
// ... do work
span.end();
```

### 2.3 Database Operation Monitoring

```typescript
import { monitorDatabaseOperation } from './lib/monitoring';

const submissions = await monitorDatabaseOperation(
  'getCompanySubmissions',
  () => getCompanySubmissions(companyId)
);
```

### 2.4 API Call Monitoring

```typescript
import { monitorApiCall } from './lib/monitoring';

const response = await monitorApiCall(
  '/api/submissions',
  'GET',
  () => fetch('/api/submissions')
);
```

---

## 3. Analytics (Google Analytics)

### 3.1 Setup (Future)

```typescript
// Setup in future
import { initializeGoogleAnalytics } from './lib/analytics';

initializeGoogleAnalytics(process.env.VITE_GOOGLE_ANALYTICS_ID);
```

### 3.2 Events to Track

```typescript
// Page views
trackPageView('Dashboard', { userId: user.id });

// Feature usage
trackFeatureUsage('QRCodeGenerated', 'Generated');
trackFeatureUsage('WebhookConfigured', 'Created');

// Conversions
trackEvent({
  category: 'Conversion',
  action: 'SignUp',
  label: 'Email',
});

trackEvent({
  category: 'Conversion',
  action: 'UpgradePlan',
  label: 'Growth',
  value: 4900, // cents
});
```

---

## 4. Session Tracking

### 4.1 Session Heartbeat

- ✅ Automatically tracks active sessions every 5 minutes
- ✅ Helps identify active user count
- ✅ Stops on logout

### 4.2 User Context

```typescript
import { setUserContext, clearUserContext } from './lib/monitoring';

// On login
setUserContext(user.id, user.email, {
  companyId: user.companyId,
  plan: subscription.tier,
});

// On logout
clearUserContext();
```

---

## 5. Dashboards & Reports

### 5.1 Sentry Dashboard

**Key Sections:**
1. **Issues** - All errors grouped by type
2. **Performance** - Transaction traces and timings
3. **Replays** - Session replays with errors
4. **Health** - Error rate, recovery time, etc.

**Useful Reports:**
- Error rate by release
- Top errors this week
- Performance by browser
- User impact by issue

### 5.2 Firebase Analytics

**Available Metrics:**
- Daily Active Users (DAU)
- Session count
- User retention
- Top countries
- Top screens
- User properties (plan, age, etc.)

### 5.3 Custom Dashboard (Recommended)

Create dashboard in Sentry showing:
- Error rate (goal: < 1%)
- Page load time (goal: < 3s)
- API response time (goal: < 200ms)
- Uptime (goal: 99.9%)
- User growth
- Conversion rate

---

## 6. Alerts & Notifications

### 6.1 Sentry Alerts

**Alert on:**
- Error rate spike (e.g., > 5% in 1 hour)
- New issue type detected
- Performance regression
- Specific error threshold

**Example Alert Rule:**
- Condition: Error rate > 5%
- Time window: 1 hour
- Notify: team@feedsolve.com
- Frequency: Once per hour

### 6.2 Firebase Alerts

**Setup via Google Cloud Console:**
- Alert on function errors
- Alert on database write failures
- Alert on quota exceedances

---

## 7. Health Checks

### 7.1 Uptime Monitoring

```
Daily health check:
- API endpoint responds (< 200ms)
- Database connectivity (< 100ms)
- Firebase auth working
- Stripe integration active
```

### 7.2 Performance Checks

```
Weekly performance report:
- Bundle size (target: < 300KB)
- First paint (target: < 1.8s)
- API response times
- Database query times
- Error rate
```

### 7.3 Compliance Checks

```
Monthly compliance review:
- GDPR data retention
- Data deletion requests processed
- Security headers present
- HTTPS enforcement
- Rate limiting active
```

---

## 8. Incident Response

### 8.1 Error Severity Levels

**Critical (P0):**
- 404 auth failures
- Payment processing failures
- Database unavailable
- Users cannot submit feedback

**High (P1):**
- API errors (500+)
- Performance degradation (>10% slower)
- Increased error rate (>1%)

**Medium (P2):**
- Non-critical errors
- Minor performance issues
- Single user errors

**Low (P3):**
- Browser console warnings
- Deprecated API usage
- Non-critical performance metrics

### 8.2 Response Procedures

**Critical Issues:**
1. Sentry alert triggers → SMS to on-call engineer
2. On-call acknowledges within 5 minutes
3. Root cause identified within 15 minutes
4. Fix deployed within 30 minutes
5. Post-mortem within 24 hours

**High Issues:**
1. Sentry alert
2. Team notified via Slack
3. Assign to team member
4. Investigate within 1 hour
5. Deploy fix within business day

**Medium/Low Issues:**
1. Log in Sentry
2. Add to backlog
3. Fix in next sprint
4. Review in retrospective

---

## 9. Metrics to Track

### 9.1 Technical Metrics

| Metric | Target | Alert | Notes |
|--------|--------|-------|-------|
| Error Rate | < 0.5% | > 1% | Per hour |
| API Response Time | < 200ms | > 500ms | P95 |
| Page Load Time | < 3s | > 5s | LCP |
| Database Query Time | < 100ms | > 200ms | P95 |
| Uptime | 99.9% | < 99% | 24 hour window |
| Bundle Size | < 300KB | > 400KB | Gzipped |
| Memory Usage | < 50MB | > 100MB | Per tab |

### 9.2 Business Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| DAU | Growth | Track daily |
| Sign-ups | Growth | Track weekly |
| Paid Conversions | > 5% | Free → paid |
| Churn Rate | < 5% | Monthly |
| MRR Growth | Growth | Monthly |
| Time to Resolution | < 2h | Support metric |

### 9.3 User Experience Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| CLS (Layout Shift) | < 0.1 | Stability |
| LCP (Paint) | < 2.5s | Visual load |
| FID (Interaction) | < 100ms | Responsiveness |
| Core Web Vitals Pass | > 90% | All three |

---

## 10. Monitoring Checklist

### Daily
- [ ] Check Sentry for new critical issues
- [ ] Review error rate spike (if any)
- [ ] Check database query performance
- [ ] Monitor API response times

### Weekly
- [ ] Review error trends
- [ ] Check performance regression
- [ ] Review user analytics
- [ ] Check uptime report

### Monthly
- [ ] Review all metrics
- [ ] Update alert thresholds (if needed)
- [ ] Analyze user retention
- [ ] Plan performance improvements
- [ ] Security audit

### Quarterly
- [ ] SOC 2 compliance review
- [ ] Full system audit
- [ ] Capacity planning
- [ ] Architecture review

---

## 11. Tools & Services

**Monitoring Stack:**
- **Sentry** - Error tracking & session replays
- **Google Analytics** - User analytics
- **Firebase Console** - Database & auth monitoring
- **Stripe Dashboard** - Payment monitoring
- **Cloudflare Analytics** - CDN & security analytics
- **StatusPage.io** - Public status (optional)

---

## 12. Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Web Vitals](https://web.dev/vitals/)
- [Firebase Performance](https://firebase.google.com/docs/perf)
- [Google Analytics](https://support.google.com/analytics/)
- [Monitoring Best Practices](https://cloud.google.com/stackdriver/docs)

---

**Last Updated:** 2026-04-21  
**Status:** Pre-Launch  
**Version:** 1.0
