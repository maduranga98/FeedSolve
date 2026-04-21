import { CreditCard } from 'lucide-react';
import type { PaymentMethod } from '../../types';

interface PaymentMethodProps {
  paymentMethod?: PaymentMethod;
  onManage?: () => void;
}

const brandLogos: Record<string, string> = {
  visa: '💳',
  mastercard: '💳',
  amex: '💳',
  diners: '💳',
  discover: '💳',
  jcb: '💳',
};

export function PaymentMethodCard({ paymentMethod, onManage }: PaymentMethodProps) {
  if (!paymentMethod) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
        <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">No payment method on file</p>
        <button
          onClick={onManage}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Add Payment Method
        </button>
      </div>
    );
  }

  const brandEmoji = brandLogos[paymentMethod.brand.toLowerCase()] || '💳';

  return (
    <div className="rounded-lg border-2 border-gray-300 p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-gray-600 text-sm">Payment Method</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {brandEmoji} {paymentMethod.brand.charAt(0).toUpperCase() + paymentMethod.brand.slice(1)}
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <p className="text-gray-700">
          <span className="font-medium">Card Number:</span> •••• {paymentMethod.last4}
        </p>
        <p className="text-gray-700">
          <span className="font-medium">Expires:</span> {String(paymentMethod.expMonth).padStart(2, '0')}/
          {String(paymentMethod.expYear).slice(-2)}
        </p>
      </div>

      <button
        onClick={onManage}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
      >
        Update Payment Method
      </button>
    </div>
  );
}
