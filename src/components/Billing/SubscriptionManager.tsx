import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UpgradeModal } from './UpgradeModal';
import { DowngradeModal } from './DowngradeModal';
import { tierPricing } from '../../lib/tier-limits';
import type { Subscription } from '../../types';

interface SubscriptionManagerProps {
  subscription: Subscription;
  onSubscriptionChange?: () => void;
}

const tierOrder = ['free', 'starter', 'growth', 'business'];

export function SubscriptionManager({ subscription, onSubscriptionChange }: SubscriptionManagerProps) {
  const navigate = useNavigate();
  const [upgradeModal, setUpgradeModal] = useState<{
    tier: 'starter' | 'growth' | 'business';
  } | null>(null);
  const [downgradeModal, setDowngradeModal] = useState<{
    tier: 'starter' | 'growth' | 'business';
  } | null>(null);

  if (subscription.tier === 'free') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <h3 className="text-xl font-bold text-blue-900 mb-3">Upgrade Your Plan</h3>
        <p className="text-blue-800 mb-6">
          Start collecting more feedback and access advanced features
        </p>
        <button
          onClick={() => navigate('/pricing')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold"
        >
          View Pricing Plans
        </button>
      </div>
    );
  }

  const currentIndex = tierOrder.indexOf(subscription.tier);
  const canUpgrade = currentIndex < tierOrder.length - 1;
  const canDowngrade = currentIndex > 1;

  const handleUpgradeClick = (toTier: 'starter' | 'growth' | 'business') => {
    setUpgradeModal({ tier: toTier });
  };

  const handleDowngradeClick = (toTier: 'starter' | 'growth' | 'business') => {
    setDowngradeModal({ tier: toTier });
  };

  const handleUpgradeConfirm = async () => {
    if (!upgradeModal) return;
    // TODO: Call Cloud Function to handle upgrade
    setUpgradeModal(null);
    onSubscriptionChange?.();
  };

  const handleDowngradeConfirm = async () => {
    if (!downgradeModal) return;
    // TODO: Call Cloud Function to handle downgrade
    setDowngradeModal(null);
    onSubscriptionChange?.();
  };

  return (
    <div className="space-y-4">
      {canUpgrade && (
        <div>
          <h3 className="font-bold text-gray-900 mb-3">Upgrade to a Higher Plan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tierOrder
              .slice(currentIndex + 1)
              .filter((tier) => tier !== 'free')
              .map((tier) => (
                <button
                  key={tier}
                  onClick={() => handleUpgradeClick(tier as 'starter' | 'growth' | 'business')}
                  className="p-4 border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition-colors text-left"
                >
                  <p className="font-bold text-gray-900 capitalize">{tier}</p>
                  <p className="text-sm text-gray-600">
                    ${tierPricing[tier as keyof typeof tierPricing][subscription.billing]}/
                    {subscription.billing === 'monthly' ? 'mo' : 'yr'}
                  </p>
                </button>
              ))}
          </div>
        </div>
      )}

      {canDowngrade && (
        <div className="pt-6 border-t border-gray-200">
          <h3 className="font-bold text-gray-900 mb-3">Downgrade to a Lower Plan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tierOrder
              .slice(1, currentIndex)
              .map((tier) => (
                <button
                  key={tier}
                  onClick={() => handleDowngradeClick(tier as 'starter' | 'growth' | 'business')}
                  className="p-4 border-2 border-orange-300 rounded-lg hover:bg-orange-50 transition-colors text-left"
                >
                  <p className="font-bold text-gray-900 capitalize">{tier}</p>
                  <p className="text-sm text-gray-600">
                    ${tierPricing[tier as keyof typeof tierPricing][subscription.billing]}/
                    {subscription.billing === 'monthly' ? 'mo' : 'yr'}
                  </p>
                </button>
              ))}
          </div>
        </div>
      )}

      {upgradeModal && (
        <UpgradeModal
          isOpen={true}
          fromTier={subscription.tier}
          toTier={upgradeModal.tier}
          currentBilling={subscription.billing}
          onClose={() => setUpgradeModal(null)}
          onConfirm={handleUpgradeConfirm}
        />
      )}

      {downgradeModal && (
        <DowngradeModal
          isOpen={true}
          fromTier={subscription.tier}
          toTier={downgradeModal.tier}
          currentBilling={subscription.billing}
          onClose={() => setDowngradeModal(null)}
          onConfirm={handleDowngradeConfirm}
        />
      )}
    </div>
  );
}
