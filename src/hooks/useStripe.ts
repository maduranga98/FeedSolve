import { getFunctions, httpsCallable } from 'firebase/functions';
import { useState } from 'react';

export function useStripe() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const functions = getFunctions();

  const createCheckoutSession = async (priceId: string) => {
    setLoading(true);
    setError(null);

    try {
      const fn = httpsCallable(functions, 'createCheckoutSession');
      const origin = window.location.origin;
      const response = (await fn({
        priceId,
        successUrl: `${origin}/billing?success=true`,
        cancelUrl: `${origin}/pricing?canceled=true`,
      })) as any;

      if (!response.data.url) {
        throw new Error('No checkout URL returned from server');
      }

      window.location.href = response.data.url;
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
      const fn = httpsCallable(functions, 'createBillingPortalSession');
      const response = (await fn({})) as any;

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

  const changeSubscription = async (priceId: string) => {
    setLoading(true);
    setError(null);

    try {
      const fn = httpsCallable(functions, 'changeSubscription');
      await fn({ priceId });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change subscription';
      setError(message);
      console.error('Change subscription error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async () => {
    setLoading(true);
    setError(null);

    try {
      const fn = httpsCallable(functions, 'cancelSubscription');
      await fn({});
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel subscription';
      setError(message);
      console.error('Cancel subscription error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createCheckoutSession,
    createBillingPortalSession,
    changeSubscription,
    cancelSubscription,
    loading,
    error,
  };
}
