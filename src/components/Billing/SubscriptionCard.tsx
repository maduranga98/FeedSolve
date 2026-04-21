import { format } from 'date-fns';
import { AlertCircle } from 'lucide-react';
import type { Subscription } from '../../types';

interface SubscriptionCardProps {
  subscription: Subscription;
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const tierNames: Record<string, string> = {
    free: 'Free',
    starter: 'Starter',
    growth: 'Growth',
    business: 'Business',
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp.seconds * 1000);
    return format(date, 'MMM d, yyyy');
  };

  const isPastDue = subscription.status === 'past_due';

  return (
    <div
      className={`rounded-lg border-2 p-6 ${
        isPastDue ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            {tierNames[subscription.tier]}
          </h3>
          <p className="text-gray-600 mt-1">
            {subscription.billing === 'monthly' ? 'Monthly' : 'Annual'} Billing
          </p>
        </div>
        <span
          className={`px-4 py-2 rounded-full text-sm font-bold ${
            subscription.status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {subscription.status === 'active' ? 'Active' : 'Past Due'}
        </span>
      </div>

      {isPastDue && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-900">Payment Failed</p>
            <p className="text-red-800 text-sm">Please update your payment method to continue service.</p>
          </div>
        </div>
      )}

      {subscription.currentPeriodEnd && (
        <div className="grid grid-cols-2 gap-6 text-center">
          <div>
            <p className="text-gray-600 text-sm">Period Start</p>
            <p className="text-lg font-bold text-gray-900">
              {formatDate(subscription.currentPeriodStart)}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Renews On</p>
            <p className="text-lg font-bold text-gray-900">
              {formatDate(subscription.currentPeriodEnd)}
            </p>
          </div>
        </div>
      )}

      {subscription.tier === 'free' && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-900">
            Unlock more features and higher limits with a paid plan
          </p>
        </div>
      )}
    </div>
  );
}
