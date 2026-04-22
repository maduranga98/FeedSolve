import { loadStripe } from '@stripe/stripe-js';

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

export const stripe = stripePublicKey ? loadStripe(stripePublicKey) : null;

export const priceIds = {
  starter: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_STARTER_MONTHLY,
    annual: import.meta.env.VITE_STRIPE_PRICE_STARTER_ANNUAL,
  },
  growth: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_GROWTH_MONTHLY,
    annual: import.meta.env.VITE_STRIPE_PRICE_GROWTH_ANNUAL,
  },
  business: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_BUSINESS_MONTHLY,
    annual: import.meta.env.VITE_STRIPE_PRICE_BUSINESS_ANNUAL,
  },
};

export function getPriceId(tier: 'starter' | 'growth' | 'business', billing: 'monthly' | 'annual'): string {
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
