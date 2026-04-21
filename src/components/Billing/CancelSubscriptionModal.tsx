import { X, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  tier: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const tierNames: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  growth: 'Growth',
  business: 'Business',
};

export function CancelSubscriptionModal({
  isOpen,
  tier,
  onClose,
  onConfirm,
}: CancelSubscriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancellation failed');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold">Cancel Subscription</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Warning */}
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900 mb-2">You're about to cancel</p>
              <p className="text-red-800 text-sm">
                Your {tierNames[tier]} plan will be canceled at the end of your current billing period.
                All paid features will be immediately unavailable, and your account will revert to the
                Free plan.
              </p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <span className="font-bold">What happens next:</span> You'll retain access until the end of your
              current billing period. We'll send a confirmation email.
            </p>
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
              className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Cancel My Subscription'}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-bold disabled:opacity-50"
            >
              Keep Subscription
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
