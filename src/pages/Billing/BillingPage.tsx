import { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import { SubscriptionCard } from '../../components/Billing/SubscriptionCard';
import { SubscriptionManager } from '../../components/Billing/SubscriptionManager';
import { PaymentMethodCard } from '../../components/Billing/PaymentMethod';
import { InvoiceTable } from '../../components/Billing/InvoiceTable';
import { useSubscription } from '../../hooks/useSubscription';
import { useInvoices } from '../../hooks/useInvoices';
import { useStripe } from '../../hooks/useStripe';
import { LoadingSpinner } from '../../components/Shared';

export function BillingPage() {
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const { invoices, loading: invoicesLoading } = useInvoices();
  const { createBillingPortalSession, cancelSubscription, loading: portalLoading } = useStripe();
  const [error, setError] = useState<string | null>(null);

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
      <div className="min-h-screen bg-[#F4F7FA]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <p className="text-[#6B7B8D]">Unable to load billing information</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FA]">
      {/* Page header */}
      <div className="bg-white border-b border-[#E8ECF0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#EBF5FB] rounded-xl flex items-center justify-center">
              <CreditCard size={20} className="text-[#2E86AB]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1E3A5F]">Billing & Subscription</h1>
              <p className="text-sm text-[#6B7B8D] mt-0.5">Manage your plan, payment method, and invoices</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {error && (
          <div className="p-4 bg-[#FFE5E5] border border-[#E74C3C] text-[#E74C3C] rounded-xl">
            {error}
          </div>
        )}

        {/* Current Subscription */}
        <div>
          <h2 className="text-lg font-semibold text-[#1E3A5F] mb-4">Current Subscription</h2>
          <SubscriptionCard
            subscription={subscription}
            onCancel={() => cancelSubscription().catch((err) => setError(err.message))}
          />
        </div>

        {/* Subscription Management */}
        <div>
          <h2 className="text-lg font-semibold text-[#1E3A5F] mb-4">Manage Subscription</h2>
          <SubscriptionManager subscription={subscription} onSubscriptionChange={() => {}} />
        </div>

        {/* Billing Actions */}
        {subscription.tier !== 'free' && (
          <div>
            <button
              onClick={() => createBillingPortalSession().catch((err) => setError(err.message))}
              disabled={portalLoading}
              className="px-5 py-2.5 bg-[#2E86AB] text-white rounded-lg hover:bg-[#1E6A9A] font-medium disabled:opacity-50 transition-colors text-sm"
            >
              {portalLoading ? 'Loading...' : 'Manage Billing in Portal'}
            </button>
          </div>
        )}

        {/* Payment Method */}
        <div>
          <h2 className="text-lg font-semibold text-[#1E3A5F] mb-4">Payment Method</h2>
          <PaymentMethodCard
            paymentMethod={undefined}
            onManage={() => createBillingPortalSession().catch((err) => setError(err.message))}
          />
        </div>

        {/* Invoice History */}
        <div>
          <h2 className="text-lg font-semibold text-[#1E3A5F] mb-4">Invoice History</h2>
          <div className="bg-white rounded-xl border border-[#E8ECF0] overflow-hidden">
            <InvoiceTable invoices={invoices} isLoading={invoicesLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
