import { useState } from 'react';
import { Navbar } from '../../components/Navigation/Navbar';
import { SubscriptionCard } from '../../components/Billing/SubscriptionCard';
import { PaymentMethodCard } from '../../components/Billing/PaymentMethod';
import { InvoiceTable } from '../../components/Billing/InvoiceTable';
import { useSubscription } from '../../hooks/useSubscription';
import { useInvoices } from '../../hooks/useInvoices';
import { useStripe } from '../../hooks/useStripe';
import { LoadingSpinner } from '../../components/Shared';

export function BillingPage() {
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const { invoices, loading: invoicesLoading } = useInvoices();
  const { createBillingPortalSession, loading: portalLoading } = useStripe();
  const [error, setError] = useState<string | null>(null);

  if (subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <p className="text-gray-600">Unable to load billing information</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Billing & Subscription</h1>

        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Current Subscription */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Subscription</h2>
          <SubscriptionCard subscription={subscription} />
        </div>

        {/* Billing Actions */}
        {subscription.tier !== 'free' && (
          <div className="mb-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => createBillingPortalSession().catch((err) => setError(err.message))}
              disabled={portalLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400"
            >
              {portalLoading ? 'Loading...' : 'Manage Billing'}
            </button>
            <button
              className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-medium"
              onClick={() => setError('Use "Manage Billing" to modify your subscription')}
            >
              Upgrade Plan
            </button>
          </div>
        )}

        {/* Payment Method */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Method</h2>
          <PaymentMethodCard
            paymentMethod={undefined}
            onManage={() => createBillingPortalSession().catch((err) => setError(err.message))}
          />
        </div>

        {/* Invoice History */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Invoice History</h2>
          <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
            <InvoiceTable invoices={invoices} isLoading={invoicesLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
