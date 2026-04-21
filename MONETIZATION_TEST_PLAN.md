# FeedSolve Monetization Feature Test Plan

## Overview

This document outlines the comprehensive test plan for Week 3 monetization features including Stripe integration, subscription management, tier gating, and usage tracking.

## Test Environment Setup

### Prerequisites
- Stripe test account with test API keys configured
- Local Firebase emulator or test project
- Test user accounts (Free, Starter, Growth, Business)
- Browser dev tools for debugging

### Test Data
```
Free User:
- Email: free@test.com
- Plan: Free
- Expected limits: 1 board, 50 submissions, 1 team member

Starter User:
- Email: starter@test.com
- Plan: Starter
- Expected limits: 3 boards, 500 submissions, 3 team members

Growth User:
- Email: growth@test.com
- Plan: Growth
- Expected limits: 10 boards, 5000 submissions, 10 team members

Business User:
- Email: business@test.com
- Plan: Business
- Expected limits: Unlimited boards, submissions, team members
```

---

## Day 1: Pricing Page Testing

### Test Cases: Pricing Page Display

#### TC-D1-001: Pricing Page Loads
- **Action**: Navigate to `/pricing`
- **Expected**: Page loads without errors, shows 4 pricing tiers
- **Status**: Pass/Fail

#### TC-D1-002: Billing Toggle Works
- **Action**: Click "Annual" button
- **Expected**: Prices update to annual prices with "Save 20%" label
- **Action**: Click "Monthly" button
- **Expected**: Prices revert to monthly prices
- **Status**: Pass/Fail

#### TC-D1-003: Pricing Accuracy
- **Action**: Verify prices displayed match tier configuration
- **Expected**: 
  - Free: $0
  - Starter: $19/mo, $228/yr
  - Growth: $49/mo, $588/yr
  - Business: $129/mo, $1548/yr
- **Status**: Pass/Fail

#### TC-D1-004: Feature Comparison Table
- **Action**: Scroll to comparison table
- **Expected**: All features listed with checkmarks/X for each tier
- **Status**: Pass/Fail

#### TC-D1-005: CTA Buttons
- **Action**: Verify all "Get Started" buttons are clickable
- **Expected**: Buttons show loading state on click
- **Status**: Pass/Fail

### Test Cases: Stripe Checkout Integration

#### TC-D1-006: Unauthenticated User Flow
- **Action**: Click "Get Started" on any paid tier without logging in
- **Expected**: Redirected to login page
- **Status**: Pass/Fail

#### TC-D1-007: Checkout Session Creation
- **Action**: Login and click "Get Started" on Starter plan
- **Expected**: Redirected to Stripe Checkout, session loads
- **Status**: Pass/Fail

#### TC-D1-008: Checkout with Valid Card
- **Action**: In Stripe Checkout, enter test card 4242 4242 4242 4242
- **Action**: Complete checkout
- **Expected**: Redirected to success page
- **Status**: Pass/Fail

#### TC-D1-009: Checkout with Declined Card
- **Action**: In Stripe Checkout, enter test card 4000 0000 0000 0002
- **Expected**: Checkout shows error, allows retry
- **Status**: Pass/Fail

#### TC-D1-010: Monthly vs Annual Selection
- **Action**: Select annual plan and checkout
- **Expected**: Stripe reflects annual pricing
- **Action**: Repeat with monthly
- **Expected**: Stripe reflects monthly pricing
- **Status**: Pass/Fail

---

## Day 2: Billing Dashboard Testing

### Test Cases: Subscription Display

#### TC-D2-001: Billing Page Access
- **Action**: Login and navigate to `/billing`
- **Expected**: Billing page loads with current subscription
- **Status**: Pass/Fail

#### TC-D2-002: Free Plan Display
- **Action**: Login as free user, go to `/billing`
- **Expected**: Shows "Free" plan with upgrade prompts
- **Status**: Pass/Fail

#### TC-D2-003: Paid Plan Display
- **Action**: Login as paid user (Starter/Growth/Business)
- **Expected**: Shows current tier, billing cycle, renewal date
- **Status**: Pass/Fail

#### TC-D2-004: Subscription Status
- **Action**: Verify subscription status badge
- **Expected**: Shows "Active" for active subscriptions, "Past Due" for failed payments
- **Status**: Pass/Fail

#### TC-D2-005: Renewal Date Display
- **Action**: Check renewal date shown
- **Expected**: Displays correct date (30 days from now for monthly)
- **Status**: Pass/Fail

### Test Cases: Invoice History

#### TC-D2-006: Invoice List Display
- **Action**: Scroll to "Invoice History" section
- **Expected**: Shows all past invoices in table format
- **Status**: Pass/Fail

#### TC-D2-007: Invoice Columns
- **Action**: Check invoice table columns
- **Expected**: Displays Date, Description, Amount, Status, Download button
- **Status**: Pass/Fail

#### TC-D2-008: Invoice Download
- **Action**: Click "Download" on an invoice
- **Expected**: PDF downloads successfully
- **Status**: Pass/Fail

#### TC-D2-009: Empty Invoice List
- **Action**: Login as newly upgraded user (before first invoice)
- **Expected**: Shows "No invoices yet"
- **Status**: Pass/Fail

### Test Cases: Payment Method Display

#### TC-D2-010: No Payment Method (Free)
- **Action**: Login as free user, check payment method section
- **Expected**: Shows "No payment method on file"
- **Status**: Pass/Fail

#### TC-D2-011: Payment Method After Checkout
- **Action**: Complete paid checkout, go to billing
- **Expected**: Shows card brand, last 4 digits, expiry
- **Status**: Pass/Fail

---

## Day 3: Tier Gating Testing

### Test Cases: Feature Access Control

#### TC-D3-001: Free Tier - Reply Feature Hidden
- **Action**: Login as free user, view submission detail
- **Expected**: Reply field is hidden or disabled
- **Status**: Pass/Fail

#### TC-D3-002: Paid Tiers - Reply Feature Visible
- **Action**: Login as Starter/Growth user, view submission detail
- **Expected**: Reply field is visible and enabled
- **Status**: Pass/Fail

#### TC-D3-003: Free Tier - Analytics Hidden
- **Action**: Login as free user, navigate to analytics
- **Expected**: Shows upgrade prompt instead of analytics
- **Status**: Pass/Fail

#### TC-D3-004: Growth/Business - Analytics Visible
- **Action**: Login as Growth/Business user, navigate to analytics
- **Expected**: Full analytics dashboard visible
- **Status**: Pass/Fail

#### TC-D3-005: Custom Branding - Feature Gating
- **Action**: Login as Free/Starter, attempt to customize branding
- **Expected**: Feature disabled with "Upgrade" prompt
- **Action**: Login as Growth/Business
- **Expected**: Feature enabled
- **Status**: Pass/Fail

### Test Cases: Board Creation Limits

#### TC-D3-006: Free Tier - Board Limit Enforcement
- **Action**: Login as free user (already has 1 board)
- **Action**: Attempt to create 2nd board
- **Expected**: Error message: "Board limit reached (1 maximum)"
- **Status**: Pass/Fail

#### TC-D3-007: Starter Tier - Board Limit (3 boards)
- **Action**: Login as Starter, create 3 boards successfully
- **Action**: Attempt to create 4th board
- **Expected**: Error message: "Board limit reached (3 maximum)"
- **Status**: Pass/Fail

#### TC-D3-008: Growth Tier - Board Limit (10 boards)
- **Action**: Login as Growth user
- **Expected**: Can create up to 10 boards
- **Status**: Pass/Fail

#### TC-D3-009: Business Tier - Unlimited Boards
- **Action**: Login as Business user
- **Expected**: Can create boards without limit
- **Status**: Pass/Fail

### Test Cases: Team Member Limits

#### TC-D3-010: Free Tier - Team Member Limit (1)
- **Action**: Login as free user
- **Expected**: Can only add 1 team member total
- **Status**: Pass/Fail

#### TC-D3-011: Starter Tier - Team Member Limit (3)
- **Action**: Login as Starter user
- **Expected**: Can add up to 3 team members
- **Status**: Pass/Fail

#### TC-D3-012: Growth Tier - Team Member Limit (10)
- **Action**: Login as Growth user
- **Expected**: Can add up to 10 team members
- **Status**: Pass/Fail

### Test Cases: Submission Limits

#### TC-D3-013: Free Tier - Submission Limit (50)
- **Action**: Create 50 submissions on free account
- **Expected**: Can submit successfully
- **Action**: Submit 51st feedback
- **Expected**: Error: "Submission limit reached"
- **Status**: Pass/Fail

#### TC-D3-014: Monthly Reset of Usage
- **Action**: Submit feedback, check usage counter
- **Expected**: Counter increments
- **Action**: Manually reset month (or wait)
- **Expected**: Counter resets to 0
- **Status**: Pass/Fail

---

## Day 4: Upgrade/Downgrade Workflow Testing

### Test Cases: Upgrade Flow

#### TC-D4-001: Upgrade Free to Starter
- **Action**: Login as free user, go to `/billing`
- **Action**: Click "Upgrade to Starter"
- **Expected**: Modal shows new pricing and upgrade details
- **Action**: Confirm upgrade
- **Expected**: Redirected to Stripe Checkout
- **Action**: Complete payment
- **Expected**: Subscription updates to Starter
- **Status**: Pass/Fail

#### TC-D4-002: Upgrade Starter to Growth
- **Action**: Login as Starter user, go to `/billing`
- **Action**: Click "Upgrade to Growth"
- **Expected**: Modal shows pricing difference
- **Action**: Confirm upgrade
- **Expected**: Subscription updates to Growth
- **Status**: Pass/Fail

#### TC-D4-003: Upgrade Shows Features Gained
- **Action**: Upgrade from Starter to Growth
- **Expected**: Modal shows what features you're gaining (Reply, Advanced Analytics, Custom Branding)
- **Status**: Pass/Fail

#### TC-D4-004: Upgrade Billing Proration
- **Action**: Upgrade mid-month
- **Expected**: Invoice shows prorated amount
- **Status**: Pass/Fail (requires backend implementation)

### Test Cases: Downgrade Flow

#### TC-D4-005: Downgrade with Warning
- **Action**: Login as Growth user, go to `/billing`
- **Action**: Click "Downgrade to Starter"
- **Expected**: Modal shows warning: "You will lose Reply to submitters, Advanced Analytics"
- **Status**: Pass/Fail

#### TC-D4-006: Downgrade Confirmation
- **Action**: Click "Confirm Downgrade" in modal
- **Expected**: Subscription downgrades
- **Expected**: Savings shown (e.g., "Save $10/month")
- **Status**: Pass/Fail

#### TC-D4-007: Downgrade Takes Effect End of Cycle
- **Action**: Downgrade Growth to Starter
- **Expected**: Can still use Growth features until billing cycle ends
- **Status**: Pass/Fail (depends on Stripe behavior)

#### TC-D4-008: Feature Removal After Downgrade
- **Action**: Downgrade from Growth to Starter
- **Action**: Attempt to reply to submission
- **Expected**: Reply feature is now disabled
- **Status**: Pass/Fail

### Test Cases: Cancel Subscription

#### TC-D4-009: Cancel Subscription Flow
- **Action**: Login as paid user, go to `/billing`
- **Action**: Click "Cancel Subscription"
- **Expected**: Modal shows warning about cancellation
- **Action**: Confirm cancellation
- **Expected**: Subscription status changes to "canceled"
- **Status**: Pass/Fail

#### TC-D4-010: Revert to Free After Cancel
- **Action**: Cancel subscription
- **Expected**: Account reverts to Free plan
- **Status**: Pass/Fail

---

## Day 5: Usage Tracking & Integration Testing

### Test Cases: Usage Counter

#### TC-D5-001: Board Creation Counter
- **Action**: Create a board
- **Expected**: Usage counter increments for "Feedback Boards"
- **Status**: Pass/Fail

#### TC-D5-002: Submission Counter
- **Action**: Submit feedback to a board
- **Expected**: Usage counter increments for "Submissions This Month"
- **Status**: Pass/Fail

#### TC-D5-003: Team Member Counter
- **Action**: Add team member
- **Expected**: Usage counter increments for "Team Members"
- **Status**: Pass/Fail

#### TC-D5-004: Usage Display on Dashboard
- **Action**: Go to `/dashboard`
- **Expected**: UsageOverview component displays
- **Expected**: Shows current usage vs limits
- **Status**: Pass/Fail

#### TC-D5-005: Usage Bar Colors
- **Action**: Check usage bar appearance
- **Expected**: Green when < 80%, Yellow when 80-99%, Red when >= 100%
- **Status**: Pass/Fail

### Test Cases: Monthly Reset

#### TC-D5-006: Auto Monthly Reset
- **Action**: Verify usage resets each month (or use test data)
- **Expected**: Submission counter resets to 0
- **Status**: Pass/Fail

### Test Cases: Full Payment Flow Integration

#### TC-D5-007: Sign Up → Upgrade → Use Features
- **Action**: Create new account (free)
- **Action**: Verify limited to 1 board
- **Action**: Upgrade to Growth plan
- **Action**: Create multiple boards
- **Expected**: Works without issues
- **Status**: Pass/Fail

#### TC-D5-008: Feature Gating Throughout App
- **Action**: Trigger each feature gate scenario
- **Expected**: All gating checks work correctly
- **Expected**: Upgrade prompts appear appropriately
- **Status**: Pass/Fail

#### TC-D5-009: Billing Portal Integration
- **Action**: Click "Manage Billing" from `/billing`
- **Expected**: Redirects to Stripe portal
- **Expected**: Can manage payment method
- **Expected**: Can download invoices
- **Status**: Pass/Fail

### Test Cases: Error Scenarios

#### TC-D5-010: Network Error During Upgrade
- **Action**: Upgrade subscription with poor network
- **Expected**: Shows error message
- **Expected**: Can retry
- **Status**: Pass/Fail

#### TC-D5-011: Stripe API Error
- **Action**: (Simulate in development)
- **Expected**: Graceful error handling
- **Expected**: User can retry
- **Status**: Pass/Fail

#### TC-D5-012: Webhook Failure Handling
- **Action**: (Test with Stripe logs)
- **Expected**: Subscription syncs correctly even if webhook delayed
- **Status**: Pass/Fail

---

## Regression Testing

### Existing Features
- [ ] Dashboard still works for free users
- [ ] Submissions still create and update
- [ ] Board management still works
- [ ] Team management unchanged
- [ ] Analytics display correctly
- [ ] Navigation works with new Billing link

---

## Performance Testing

### Load Testing
- [ ] Pricing page loads in < 2 seconds
- [ ] Billing page loads in < 3 seconds
- [ ] Checkout redirects quickly
- [ ] No N+1 queries on billing page

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers

---

## Security Testing

### Data Protection
- [ ] Stripe keys never logged
- [ ] No credit card data stored locally
- [ ] Firebase rules prevent unauthorized access
- [ ] Subscription data only accessible by owner

### Authorization
- [ ] Users can only see their own billing
- [ ] Upgrade/downgrade only for account owner
- [ ] Webhook validates Stripe signature

---

## Test Execution Report

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-D1-001 | PASS/FAIL | |
| TC-D1-002 | PASS/FAIL | |
| ... | | |

---

## Known Issues & Workarounds

| Issue | Severity | Workaround | Status |
|-------|----------|-----------|--------|
| | | | |

---

## Sign-Off

- [ ] All critical tests passing
- [ ] No blocking issues
- [ ] Performance acceptable
- [ ] Ready for beta launch

**Tested by**: [Name]
**Date**: [Date]
**Status**: READY / NOT READY

