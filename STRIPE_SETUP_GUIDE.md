# Stripe Setup & Testing Guide

This guide walks you through setting up Stripe for FeedSolve and testing the payment system.

## 1. Create a Stripe Account

1. Visit https://stripe.com and click "Sign up"
2. Complete the account setup
3. Once verified, go to Dashboard → Developers → API Keys
4. You'll see two keys:
   - **Publishable Key** (pk_test_...)
   - **Secret Key** (sk_test_...)

## 2. Create Products in Stripe Dashboard

### Monthly Products
1. Go to Products → Create Product
2. Create the following with monthly billing:

| Name | Price | Price ID |
|------|-------|----------|
| FeedSolve Starter | $19/month | `price_...` |
| FeedSolve Growth | $49/month | `price_...` |
| FeedSolve Business | $129/month | `price_...` |

### Annual Products
Create the same products with annual billing at 20% discount:

| Name | Price | Price ID |
|------|-------|----------|
| FeedSolve Starter Annual | $228/year | `price_...` |
| FeedSolve Growth Annual | $588/year | `price_...` |
| FeedSolve Business Annual | $1,548/year | `price_...` |

## 3. Configure Environment Variables

Update your `.env.local` file:

```env
VITE_STRIPE_PUBLIC_KEY=pk_test_YOUR_PUBLISHABLE_KEY

VITE_STRIPE_PRICE_STARTER_MONTHLY=price_...
VITE_STRIPE_PRICE_STARTER_ANNUAL=price_...
VITE_STRIPE_PRICE_GROWTH_MONTHLY=price_...
VITE_STRIPE_PRICE_GROWTH_ANNUAL=price_...
VITE_STRIPE_PRICE_BUSINESS_MONTHLY=price_...
VITE_STRIPE_PRICE_BUSINESS_ANNUAL=price_...
```

## 4. Setup Webhook (Production Ready)

1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. Set Webhook URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events:
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the Signing Secret and add to backend env vars:

```env
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
```

## 5. Testing the Payment Flow

### Test Card Numbers

Use Stripe's test cards to simulate different scenarios:

| Card Number | Scenario |
|------------|----------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 0002 | Declined payment |
| 4000 0000 0000 0341 | Disputed charge |
| 378282246310005 | American Express |

All test cards use:
- Any future expiration date
- Any 3-digit CVC

### Testing Checklist

#### Pricing Page
- [ ] Visit `/pricing` page
- [ ] Toggle between Monthly and Annual billing
- [ ] Verify pricing updates correctly
- [ ] Click "Get Started" on paid tiers
- [ ] Verify Stripe Checkout loads

#### Checkout Flow
- [ ] Use test card 4242 4242 4242 4242
- [ ] Fill in billing details
- [ ] Complete checkout
- [ ] Verify redirect to success page
- [ ] Check that subscription is created in Firestore

#### Billing Dashboard
- [ ] Login and go to `/billing`
- [ ] Verify subscription tier displays correctly
- [ ] Verify renewal date shows
- [ ] Check invoice history appears (after successful payment)
- [ ] Verify download invoice button works

#### Tier Gating
- [ ] Create Free account
- [ ] Verify can only create 1 board
- [ ] Attempt to create 2nd board → should fail with limit message
- [ ] Upgrade to Starter
- [ ] Verify can now create 3 boards
- [ ] Try to add 4th team member → should fail (Starter limit is 3)

#### Usage Tracking
- [ ] Submit feedback on a board
- [ ] Check `/billing` for submission count increment
- [ ] Verify usage bar updates

#### Upgrade/Downgrade
- [ ] From Starter, click "Upgrade to Growth"
- [ ] Verify modal shows new pricing
- [ ] Confirm upgrade
- [ ] Verify subscription tier updates in Firestore
- [ ] From Growth, click "Downgrade to Starter"
- [ ] Verify modal warns about lost features
- [ ] Confirm downgrade

#### Error Scenarios
- [ ] Use card 4000 0000 0000 0002 → checkout fails gracefully
- [ ] Missing Stripe key → app shows error
- [ ] Network error during checkout → user can retry

### Using Stripe Test Mode

1. Stripe is always in test mode when using `pk_test_` keys
2. Test payments don't charge any real money
3. View test payments in your dashboard:
   - Developers → Events
   - Developers → Webhooks Logs
4. Test emails are sent to:
   - Customer email (if configured)
   - Webhook logs show in Dashboard

## 6. Implementation Checklist

### Backend (Cloud Functions)
- [ ] `createCheckoutSession` function working
- [ ] `createBillingPortalSession` function working
- [ ] Webhook handler processing events
- [ ] Subscription updates syncing to Firestore
- [ ] Invoice records being created

### Frontend
- [ ] Pricing page displays all tiers
- [ ] Checkout redirects to Stripe
- [ ] Billing page loads subscription data
- [ ] Usage bars display correctly
- [ ] Upgrade/downgrade modals work
- [ ] Feature gating enforces tier limits

### Database
- [ ] Company subscription field populated
- [ ] Usage tracking fields initialized
- [ ] Invoice collection created
- [ ] Billing events logged

## 7. Going Live with Stripe

1. Complete Stripe account verification
2. Get live API keys (pk_live_..., sk_live_...)
3. Update environment variables with live keys
4. Test on production URL
5. Create live products with production prices
6. Enable production webhook
7. Deploy to production

⚠️ **IMPORTANT**: Never commit real API keys to version control. Use environment variables and secrets management.

## 8. Troubleshooting

### "Stripe not loaded" error
- Check VITE_STRIPE_PUBLIC_KEY is set correctly
- Verify key is the publishable key (starts with pk_)

### Checkout fails silently
- Check browser console for errors
- Verify createCheckoutSession function exists
- Ensure Firebase Auth is working

### Webhook events not processed
- Check webhook logs in Stripe Dashboard
- Verify webhook secret is correct
- Ensure backend is reachable at webhook URL

### Subscription not syncing to Firestore
- Check webhook is configured correctly
- Verify webhook handler has database permissions
- Check Firestore rules allow updates

## 9. Testing Data

Create test data for testing:

```
Test User:
- Email: test@example.com
- Company: Test Company
- Started on: Free plan

Test Flow:
1. Sign up with test@example.com
2. Create test board
3. Upgrade to Growth plan
4. Add team members
5. Create another board
6. Downgrade to Starter
7. Cancel subscription
```

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe API Keys](https://stripe.com/docs/keys)
- [Firebase Cloud Functions with Stripe](https://firebase.google.com/docs/functions/callable)
