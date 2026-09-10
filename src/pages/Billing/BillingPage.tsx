import { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import { SubscriptionCard } from '../../components/Billing/SubscriptionCard';
import { SubscriptionManager } from '../../components/Billing/SubscriptionManager';
import { InvoiceTable } from '../../components/Billing/InvoiceTable';
import { useSubscription } from '../../hooks/useSubscription';
import { useInvoices } from '../../hooks/useInvoices';
import { useStripe } from '../../hooks/useStripe';
import { LoadingSpinner } from '../../components/Shared';

export function BillingPage() {
  const { subscription, loading: subscriptionLoading, refetch } = useSubscription();
  const { invoices, loading: invoicesLoading } = useInvoices();
  const { createBillingPortalSession, cancelSubscription, loading: portalLoading } = useStripe();
  const [error, setError] = useState<string | null>(null);

  const handleSubscriptionChange = async () => {
    await refetch();
  };

  const handleCancelSubscription = async () => {
    await cancelSubscription();
    setTimeout(() => {
      refetch();
    }, 1500);
  };

  useEffect(() => {
    document.title = 'Billing | FeedSolve';
  }, []);

  if (subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-[var(--c-se1e8ef)]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <p className="text-[var(--c-t6b7b8d)]">Unable to load billing information</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--c-se1e8ef)]">
      {/* Page header */}
      <div className="bg-[var(--c-sffffff)] border-b border-[var(--c-be8ecf0)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--c-sebf5fb)] rounded-xl flex items-center justify-center">
              <CreditCard size={20} className="text-[var(--c-t2e86ab)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--c-t1e3a5f)]">Billing & Subscription</h1>
              <p className="text-sm text-[var(--c-t6b7b8d)] mt-0.5">Manage your plan, payment method, and invoices</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {error && (
          <div className="p-4 bg-[var(--c-sffe5e5)] border border-[var(--c-be74c3c)] text-[var(--c-te74c3c)] rounded-xl">
            {error}
          </div>
        )}

        {/* Current Subscription */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--c-t1e3a5f)] mb-4">Current Subscription</h2>
          <SubscriptionCard
            subscription={subscription}
            onCancel={() => handleCancelSubscription().catch((err) => setError(err.message))}
          />
        </div>

        {/* Subscription Management */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--c-t1e3a5f)] mb-4">Manage Subscription</h2>
          <SubscriptionManager subscription={subscription} onSubscriptionChange={handleSubscriptionChange} />
        </div>

        {/* Billing Actions */}
        {subscription.tier !== 'free' && (
          <div>
            <button
              onClick={() => createBillingPortalSession().catch((err) => setError(err.message))}
              disabled={portalLoading}
              className="px-5 py-2.5 bg-[var(--c-s2e86ab)] text-white rounded-lg hover:bg-[var(--c-s1e6a9a)] font-medium disabled:opacity-50 transition-colors text-sm"
            >
              {portalLoading ? 'Loading...' : 'Manage Billing in Portal'}
            </button>
          </div>
        )}

        {/* Invoice History */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--c-t1e3a5f)] mb-4">Invoice History</h2>
          <div className="bg-[var(--c-sffffff)] rounded-xl border border-[var(--c-be8ecf0)] overflow-hidden">
            <InvoiceTable invoices={invoices} isLoading={invoicesLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
