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
      <div className="min-h-screen bg-[#E1E8EF]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <p className="text-[#6B7B8D]">Unable to load billing information</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E1E8EF]">
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
          <SubscriptionManager subscription={subscription} onSubscriptionChange={handleSubscriptionChange} />
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

        {/* Invoice History */}
        <div>
          <h2 className="text-lg font-semibold text-[#1E3A5F] mb-4">Invoice History</h2>
          <div className="bg-white rounded-xl border border-[#E8ECF0] overflow-hidden">
            <InvoiceTable invoices={invoices} isLoading={invoicesLoading} />
          </div>
        </div>

        {/* Instructions Section */}
        <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
          <h2 className="text-lg font-semibold text-[#1E3A5F] mb-4">How to Use Your Plan</h2>
          <div className="space-y-4 text-[#6B7B8D]">
            <div>
              <h3 className="font-semibold text-[#1E3A5F] mb-2">Getting Started</h3>
              <p>Log in to your FeedSolve account and start creating feedback boards. Each tier comes with a specific number of boards and submission limits to help you manage your feedback effectively.</p>
            </div>
            <div>
              <h3 className="font-semibold text-[#1E3A5F] mb-2">Managing Your Subscription</h3>
              <p>You can upgrade, downgrade, or cancel your subscription at any time from the "Manage Subscription" section above. Changes take effect immediately for upgrades, or at the end of your billing cycle for downgrades.</p>
            </div>
            <div>
              <h3 className="font-semibold text-[#1E3A5F] mb-2">Features by Plan</h3>
              <p>Different plans unlock different features. Visit our pricing page to see a detailed comparison of all features available in each plan, and upgrade anytime to access premium features.</p>
            </div>
            <div>
              <h3 className="font-semibold text-[#1E3A5F] mb-2">Usage & Limits</h3>
              <p>Monitor your usage in the dashboard. Each plan has monthly submission limits and team member restrictions. The dashboard shows your current usage and how much quota remains.</p>
            </div>
          </div>
        </div>

        {/* Help & Support Section */}
        <div className="bg-[#EBF5FB] rounded-xl border border-[#2E86AB] p-6">
          <h2 className="text-lg font-semibold text-[#1E3A5F] mb-4">Help & Support</h2>
          <div className="space-y-4">
            <p className="text-[#6B7B8D]">
              Need assistance with your billing, subscription, or have questions about your plan? We're here to help!
            </p>
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-[#2E86AB]">
              <div className="w-10 h-10 bg-[#2E86AB] rounded-full flex items-center justify-center text-white font-bold">
                ✉
              </div>
              <div>
                <p className="font-semibold text-[#1E3A5F]">Contact Our Support Team</p>
                <a
                  href="mailto:hello@feedsolve.com"
                  className="text-[#2E86AB] hover:underline text-sm"
                >
                  hello@feedsolve.com
                </a>
              </div>
            </div>
            <p className="text-sm text-[#6B7B8D]">
              Email us with any questions about billing, subscription management, or feature requests. Our team typically responds within 24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
