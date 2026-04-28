import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/Navigation/Navbar';
import { BillingToggle } from '../../components/Pricing/BillingToggle';
import { PricingCard } from '../../components/Pricing/PricingCard';
import { PricingComparisonTable } from '../../components/Pricing/PricingComparisonTable';
import { useStripe } from '../../hooks/useStripe';
import { useAuth } from '../../hooks/useAuth';
import { getPriceId } from '../../lib/stripe';

export function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const { createCheckoutSession, loading, error } = useStripe();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = async (tier: 'starter' | 'growth' | 'business') => {
    if (!user) {
      navigate('/login');
      return;
    }

    const priceId = getPriceId(tier, billing);
    await createCheckoutSession(priceId);
  };

  const features = {
    free: [
      '1 feedback board',
      '50 submissions/month',
      '1 team member',
      'Anonymous feedback support',
      'Basic submission management',
    ],
    starter: [
      '3 feedback boards',
      '500 submissions/month',
      '3 team members',
      'Email notifications',
      'Basic analytics',
      'Anonymous feedback support',
    ],
    growth: [
      '10 feedback boards',
      '5,000 submissions/month',
      '10 team members',
      'Email notifications',
      'Advanced analytics',
      'Reply to submitters',
      'Custom branding (removable badge)',
    ],
    business: [
      'Unlimited feedback boards',
      'Unlimited submissions/month',
      'Unlimited team members',
      'Email notifications',
      'Advanced analytics',
      'Reply to submitters',
      'Custom branding (no badge)',
      'API access',
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600">Choose the perfect plan for your feedback needs</p>
        </div>

        <BillingToggle onToggle={setBilling} />

        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <PricingCard
            tier="free"
            monthlyPrice={0}
            annualPrice={0}
            billing={billing}
            features={features.free}
            onGetStarted={() => navigate('/dashboard')}
          />
          <PricingCard
            tier="starter"
            monthlyPrice={19}
            annualPrice={182}
            billing={billing}
            features={features.starter}
            onGetStarted={() => handleGetStarted('starter')}
            isLoading={loading}
          />
          <PricingCard
            tier="growth"
            monthlyPrice={49}
            annualPrice={470}
            billing={billing}
            features={features.growth}
            isPopular
            onGetStarted={() => handleGetStarted('growth')}
            isLoading={loading}
          />
          <PricingCard
            tier="business"
            monthlyPrice={79}
            annualPrice={758}
            billing={billing}
            features={features.business}
            onGetStarted={() => handleGetStarted('business')}
            isLoading={loading}
          />
        </div>

        <PricingComparisonTable />

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="text-left">
              <h3 className="font-bold text-gray-900 mb-2">Can I upgrade or downgrade anytime?</h3>
              <p className="text-gray-600">
                Yes! You can change your plan at any time. Upgrades take effect immediately, and
                downgrades take effect at the end of your billing cycle.
              </p>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-gray-900 mb-2">Is there a free trial?</h3>
              <p className="text-gray-600">
                Absolutely! Start with our Free plan to explore FeedSolve. Upgrade whenever you're
                ready.
              </p>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit cards (Visa, Mastercard, American Express) through Stripe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
