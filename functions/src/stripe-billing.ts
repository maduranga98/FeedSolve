import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

if (!admin.apps.length) {
  admin.initializeApp();
}

// Maps Stripe price IDs (from src/config/stripe.ts) to app tier names
const PRICE_TO_TIER: Record<string, string> = {
  price_1TQpweQQchLsdaEfeIg5uZ2A: 'starter',
  price_1TQpweQQchLsdaEfzijJNcqm: 'starter',
  price_1TQpyZQQchLsdaEfY5UPPMRL: 'growth',
  price_1TQpyZQQchLsdaEf6PmISi15: 'growth',
  price_1TQq0KQQchLsdaEf0RQA54Kb: 'business',
  price_1TQq0KQQchLsdaEfEsV7xMaa: 'business',
};

const PRICE_TO_BILLING: Record<string, 'monthly' | 'annual'> = {
  price_1TQpweQQchLsdaEfeIg5uZ2A: 'monthly',
  price_1TQpweQQchLsdaEfzijJNcqm: 'annual',
  price_1TQpyZQQchLsdaEfY5UPPMRL: 'monthly',
  price_1TQpyZQQchLsdaEf6PmISi15: 'annual',
  price_1TQq0KQQchLsdaEf0RQA54Kb: 'monthly',
  price_1TQq0KQQchLsdaEfEsV7xMaa: 'annual',
};

function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY || functions.config().stripe?.secret_key;
  if (!secretKey) {
    throw new functions.https.HttpsError('internal', 'Stripe secret key not configured');
  }
  return new Stripe(secretKey, { apiVersion: '2024-06-20' });
}

async function getCompanyId(uid: string): Promise<string> {
  const userDoc = await admin.firestore().collection('users').doc(uid).get();
  const companyId = userDoc.data()?.companyId;
  if (!companyId) {
    throw new functions.https.HttpsError('not-found', 'User company not found');
  }
  return companyId;
}

export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { priceId } = data;
  if (!priceId || !PRICE_TO_TIER[priceId]) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid priceId');
  }

  const uid = context.auth.uid;
  const companyId = await getCompanyId(uid);
  const db = admin.firestore();
  const companyDoc = await db.collection('companies').doc(companyId).get();
  const company = companyDoc.data();

  const stripe = getStripe();
  let customerId: string = company?.subscription?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: context.auth.token.email,
      metadata: { companyId, userId: uid },
    });
    customerId = customer.id;
    await db.collection('companies').doc(companyId).update({
      'subscription.stripeCustomerId': customerId,
    });
  }

  const appUrl = process.env.APP_URL || 'https://feedsolve.com';
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/billing?success=true`,
    cancel_url: `${appUrl}/pricing?canceled=true`,
    metadata: { companyId },
    subscription_data: { metadata: { companyId } },
  });

  return { sessionId: session.id };
});

export const createBillingPortalSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const uid = context.auth.uid;
  const companyId = await getCompanyId(uid);
  const db = admin.firestore();
  const companyDoc = await db.collection('companies').doc(companyId).get();
  const customerId: string = companyDoc.data()?.subscription?.stripeCustomerId;

  if (!customerId) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'No Stripe customer found. Please subscribe first.'
    );
  }

  const stripe = getStripe();
  const appUrl = process.env.APP_URL || 'https://feedsolve.com';
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/billing`,
  });

  return { url: session.url };
});

export const changeSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { priceId } = data;
  if (!priceId || !PRICE_TO_TIER[priceId]) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid priceId');
  }

  const uid = context.auth.uid;
  const companyId = await getCompanyId(uid);
  const db = admin.firestore();
  const companyDoc = await db.collection('companies').doc(companyId).get();
  const subscription = companyDoc.data()?.subscription;

  if (!subscription?.stripeSubscriptionId) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'No active Stripe subscription found'
    );
  }

  const stripe = getStripe();
  const stripeSubscription = await stripe.subscriptions.retrieve(
    subscription.stripeSubscriptionId
  );
  const itemId = stripeSubscription.items.data[0].id;

  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    items: [{ id: itemId, price: priceId }],
    proration_behavior: 'create_prorations',
  });

  return { success: true };
});

export const cancelSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const uid = context.auth.uid;
  const companyId = await getCompanyId(uid);
  const db = admin.firestore();
  const companyDoc = await db.collection('companies').doc(companyId).get();
  const subscription = companyDoc.data()?.subscription;

  if (!subscription?.stripeSubscriptionId) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'No active Stripe subscription found'
    );
  }

  const stripe = getStripe();
  // Cancel at period end so user retains access until billing cycle ends
  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  return { success: true };
});

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET || functions.config().stripe?.webhook_secret;

  if (!webhookSecret) {
    console.error('Stripe webhook secret not configured');
    res.status(500).send('Webhook secret not configured');
    return;
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      (req as any).rawBody,
      req.headers['stripe-signature'] as string,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).send(`Webhook Error: ${err}`);
    return;
  }

  const db = admin.firestore();

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(db, stripe, event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(db, event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(db, event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(db, event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(db, event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).send('Webhook processing failed');
  }
});

async function handleCheckoutCompleted(
  db: admin.firestore.Firestore,
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<void> {
  const companyId = session.metadata?.companyId;
  if (!companyId || !session.subscription) return;

  const sub = await stripe.subscriptions.retrieve(session.subscription as string);
  const priceId = sub.items.data[0].price.id;
  const tier = PRICE_TO_TIER[priceId] || 'starter';
  const billing = PRICE_TO_BILLING[priceId] || 'monthly';

  await db.collection('companies').doc(companyId).update({
    'subscription.stripeSubscriptionId': sub.id,
    'subscription.stripeCustomerId': session.customer as string,
    'subscription.priceId': priceId,
    'subscription.tier': tier,
    'subscription.billing': billing,
    'subscription.status': sub.status,
    'subscription.currentPeriodStart': admin.firestore.Timestamp.fromMillis(
      sub.current_period_start * 1000
    ),
    'subscription.currentPeriodEnd': admin.firestore.Timestamp.fromMillis(
      sub.current_period_end * 1000
    ),
    'subscription.upgradedAt': admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function handleSubscriptionUpdated(
  db: admin.firestore.Firestore,
  sub: Stripe.Subscription
): Promise<void> {
  const companyId = sub.metadata?.companyId;
  if (!companyId) return;

  const priceId = sub.items.data[0].price.id;
  const tier = PRICE_TO_TIER[priceId] || 'starter';
  const billing = PRICE_TO_BILLING[priceId] || 'monthly';

  const updateData: Record<string, any> = {
    'subscription.status': sub.status,
    'subscription.priceId': priceId,
    'subscription.tier': tier,
    'subscription.billing': billing,
    'subscription.currentPeriodStart': admin.firestore.Timestamp.fromMillis(
      sub.current_period_start * 1000
    ),
    'subscription.currentPeriodEnd': admin.firestore.Timestamp.fromMillis(
      sub.current_period_end * 1000
    ),
  };

  if (sub.cancel_at_period_end) {
    updateData['subscription.canceledAt'] = admin.firestore.FieldValue.serverTimestamp();
  }

  await db.collection('companies').doc(companyId).update(updateData);
}

async function handleSubscriptionDeleted(
  db: admin.firestore.Firestore,
  sub: Stripe.Subscription
): Promise<void> {
  const companyId = sub.metadata?.companyId;
  if (!companyId) return;

  await db.collection('companies').doc(companyId).update({
    'subscription.tier': 'free',
    'subscription.status': 'canceled',
    'subscription.stripeSubscriptionId': admin.firestore.FieldValue.delete(),
    'subscription.priceId': admin.firestore.FieldValue.delete(),
    'subscription.canceledAt': admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function handleInvoicePaymentSucceeded(
  db: admin.firestore.Firestore,
  invoice: Stripe.Invoice
): Promise<void> {
  const customerId = invoice.customer as string;
  if (!customerId) return;

  const companiesQuery = await db
    .collection('companies')
    .where('subscription.stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (companiesQuery.empty) return;

  const companyId = companiesQuery.docs[0].id;

  // Path: invoices/{companyId}/invoices/{docId} (matches useInvoices.ts)
  await db.collection('invoices').doc(companyId).collection('invoices').add({
    stripeInvoiceId: invoice.id,
    stripeCustomerId: customerId,
    companyId,
    amount: invoice.amount_paid / 100,
    currency: invoice.currency,
    status: 'paid',
    pdfUrl: invoice.invoice_pdf,
    periodStart: invoice.period_start
      ? admin.firestore.Timestamp.fromMillis(invoice.period_start * 1000)
      : null,
    periodEnd: invoice.period_end
      ? admin.firestore.Timestamp.fromMillis(invoice.period_end * 1000)
      : null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function handleInvoicePaymentFailed(
  db: admin.firestore.Firestore,
  invoice: Stripe.Invoice
): Promise<void> {
  const customerId = invoice.customer as string;
  if (!customerId) return;

  const companiesQuery = await db
    .collection('companies')
    .where('subscription.stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (companiesQuery.empty) return;

  const companyId = companiesQuery.docs[0].id;
  await db.collection('companies').doc(companyId).update({
    'subscription.status': 'past_due',
  });
}
