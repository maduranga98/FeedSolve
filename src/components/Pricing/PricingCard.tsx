import { Check } from 'lucide-react';
import { useState } from 'react';

interface PricingCardProps {
  tier: 'free' | 'starter' | 'growth' | 'business';
  monthlyPrice: number;
  annualPrice: number;
  billing: 'monthly' | 'annual';
  features: string[];
  isPopular?: boolean;
  onGetStarted?: () => void;
  isLoading?: boolean;
}

const tierNames = {
  free: 'Free',
  starter: 'Starter',
  growth: 'Growth',
  business: 'Business',
};

export function PricingCard({
  tier,
  monthlyPrice,
  annualPrice,
  billing,
  features,
  isPopular,
  onGetStarted,
  isLoading,
}: PricingCardProps) {
  const price = billing === 'monthly' ? monthlyPrice : Math.round(annualPrice / 12);
  const displayPrice = billing === 'monthly' ? monthlyPrice : annualPrice;

  return (
    <div
      className={`rounded-lg border-2 overflow-hidden transition-all ${
        isPopular
          ? 'border-blue-600 shadow-2xl scale-105'
          : 'border-gray-200 shadow-lg hover:shadow-xl'
      }`}
    >
      {isPopular && (
        <div className="bg-blue-600 text-white py-2 text-center font-bold text-sm">
          RECOMMENDED
        </div>
      )}

      <div className="p-8">
        <h3 className="text-2xl font-bold mb-2">{tierNames[tier]}</h3>

        {tier === 'free' ? (
          <div className="mb-6">
            <span className="text-4xl font-bold">Free</span>
          </div>
        ) : (
          <div className="mb-6">
            <span className="text-4xl font-bold">${price}</span>
            <span className="text-gray-600 ml-2">/month</span>
            {billing === 'annual' && (
              <div className="text-sm text-green-600 mt-2">
                ${displayPrice}/year (Save 20%)
              </div>
            )}
          </div>
        )}

        {tier !== 'free' && (
          <button
            onClick={onGetStarted}
            disabled={isLoading}
            className={`w-full py-3 rounded-lg font-bold mb-6 transition-colors ${
              isLoading
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : isPopular
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            {isLoading ? 'Loading...' : 'Get Started'}
          </button>
        )}

        {tier === 'free' && (
          <button
            disabled
            className="w-full py-3 rounded-lg font-bold mb-6 bg-gray-300 text-gray-700 cursor-not-allowed"
          >
            Your Plan
          </button>
        )}

        <ul className="space-y-4">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
