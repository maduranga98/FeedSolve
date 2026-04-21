import { useState } from 'react';

interface BillingToggleProps {
  onToggle: (billing: 'monthly' | 'annual') => void;
}

export function BillingToggle({ onToggle }: BillingToggleProps) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  const handleToggle = (newBilling: 'monthly' | 'annual') => {
    setBilling(newBilling);
    onToggle(newBilling);
  };

  return (
    <div className="flex items-center justify-center gap-4 mb-12">
      <button
        onClick={() => handleToggle('monthly')}
        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
          billing === 'monthly'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Monthly
      </button>
      <button
        onClick={() => handleToggle('annual')}
        className={`px-6 py-2 rounded-lg font-medium transition-colors relative ${
          billing === 'annual'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Annual
        <span className="absolute -top-8 right-0 bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
          Save 20%
        </span>
      </button>
    </div>
  );
}
