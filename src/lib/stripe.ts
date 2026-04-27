import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PRODUCTS } from '../config/stripe';

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

export const stripe = stripePublicKey ? loadStripe(stripePublicKey) : null;

// Price IDs sourced from the real Stripe products in config/stripe.ts
export const priceIds = {
  starter: {
    monthly: STRIPE_PRODUCTS.STARTER.prices.monthly,
    annual: STRIPE_PRODUCTS.STARTER.prices.annual,
  },
  growth: {
    monthly: STRIPE_PRODUCTS.GROWTH.prices.monthly,
    annual: STRIPE_PRODUCTS.GROWTH.prices.annual,
  },
  // "business" in the app maps to the "PRO" product in Stripe
  business: {
    monthly: STRIPE_PRODUCTS.PRO.prices.monthly,
    annual: STRIPE_PRODUCTS.PRO.prices.annual,
  },
};

export function getPriceId(
  tier: 'starter' | 'growth' | 'business',
  billing: 'monthly' | 'annual'
): string {
  return priceIds[tier][billing];
}

export function getTierFromPriceId(priceId: string): 'starter' | 'growth' | 'business' | null {
  for (const [tier, prices] of Object.entries(priceIds)) {
    if (prices.monthly === priceId || prices.annual === priceId) {
      return tier as 'starter' | 'growth' | 'business';
    }
  }
  return null;
}
