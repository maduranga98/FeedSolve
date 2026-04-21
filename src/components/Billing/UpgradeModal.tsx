import { X } from 'lucide-react';
import { useState } from 'react';
import { tierPricing } from '../../lib/tier-limits';

interface UpgradeModalProps {
  isOpen: boolean;
  fromTier: string;
  toTier: 'starter' | 'growth' | 'business';
  currentBilling: 'monthly' | 'annual';
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const tierNames: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  growth: 'Growth',
  business: 'Business',
};

export function UpgradeModal({
  isOpen,
  fromTier,
  toTier,
  currentBilling,
  onClose,
  onConfirm,
}: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const fromPrice = tierPricing[fromTier as keyof typeof tierPricing]?.[currentBilling] || 0;
  const toPrice = tierPricing[toTier][currentBilling];
  const priceDiff = toPrice - fromPrice;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upgrade failed');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold">Upgrade Plan</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-600 text-sm mb-2">Upgrade from</p>
            <p className="text-xl font-bold text-gray-900 mb-4">{tierNames[fromTier]}</p>

            <div className="text-2xl font-bold text-blue-600 mb-4">
              → {tierNames[toTier]}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-gray-600 text-sm mb-2">New Monthly Cost</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">${toPrice}</span>
              <span className="text-gray-600">/month</span>
            </div>
            {priceDiff > 0 && (
              <p className="text-sm text-blue-600 mt-2">
                +${priceDiff} more per month
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Confirm Upgrade'}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-bold disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
