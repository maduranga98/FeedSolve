import { getFunctions, httpsCallable } from 'firebase/functions';
import { stripe } from '../lib/stripe';
import { useState } from 'react';

export function useStripe() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const functions = getFunctions();

  const createCheckoutSession = async (
    priceId: string,
    billingCycle: 'monthly' | 'annual'
  ) => {
    setLoading(true);
    setError(null);

    try {
      const createCheckoutSessionFn = httpsCallable(functions, 'createCheckoutSession');
      const response = await createCheckoutSessionFn({
        priceId,
        billingCycle,
      }) as any;

      const stripeInstance = await stripe;
      if (!stripeInstance) {
        throw new Error('Stripe failed to load');
      }

      const { error: stripeError } = await stripeInstance.redirectToCheckout({
        sessionId: response.data.sessionId,
      });

      if (stripeError) {
        setError(stripeError.message || 'Stripe checkout failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create checkout session';
      setError(message);
      console.error('Checkout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const createBillingPortalSession = async () => {
    setLoading(true);
    setError(null);

    try {
      const createPortalSessionFn = httpsCallable(functions, 'createBillingPortalSession');
      const response = await createPortalSessionFn({}) as any;

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access billing portal';
      setError(message);
      console.error('Portal error:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    createCheckoutSession,
    createBillingPortalSession,
    loading,
    error,
  };
}
