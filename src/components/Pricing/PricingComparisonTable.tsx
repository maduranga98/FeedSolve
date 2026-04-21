import { Check, X } from 'lucide-react';

export function PricingComparisonTable() {
  const features = [
    { name: 'Feedback Boards', free: '1', starter: '3', growth: '10', business: 'Unlimited' },
    { name: 'Submissions/month', free: '50', starter: '500', growth: '5,000', business: 'Unlimited' },
    { name: 'Team Members', free: '1', starter: '3', growth: '10', business: 'Unlimited' },
    { name: 'Email Notifications', free: false, starter: true, growth: true, business: true },
    { name: 'Custom Branding', free: false, starter: false, growth: true, business: true },
    { name: 'Reply to Submitter', free: false, starter: false, growth: true, business: true },
    { name: 'Analytics', free: false, starter: 'Basic', growth: 'Advanced', business: 'Advanced' },
    { name: 'API Access', free: false, starter: false, growth: false, business: true },
  ];

  return (
    <div className="mt-12 overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left py-4 px-4 font-bold">Feature</th>
            <th className="text-center py-4 px-4 font-bold">Free</th>
            <th className="text-center py-4 px-4 font-bold">Starter</th>
            <th className="text-center py-4 px-4 font-bold">Growth</th>
            <th className="text-center py-4 px-4 font-bold">Business</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
              <td className="py-4 px-4 font-medium">{feature.name}</td>
              <td className="text-center py-4 px-4">
                {typeof feature.free === 'boolean' ? (
                  feature.free ? (
                    <Check className="w-5 h-5 text-green-500 inline" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 inline" />
                  )
                ) : (
                  <span className="text-gray-700">{feature.free}</span>
                )}
              </td>
              <td className="text-center py-4 px-4">
                {typeof feature.starter === 'boolean' ? (
                  feature.starter ? (
                    <Check className="w-5 h-5 text-green-500 inline" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 inline" />
                  )
                ) : (
                  <span className="text-gray-700">{feature.starter}</span>
                )}
              </td>
              <td className="text-center py-4 px-4">
                {typeof feature.growth === 'boolean' ? (
                  feature.growth ? (
                    <Check className="w-5 h-5 text-green-500 inline" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 inline" />
                  )
                ) : (
                  <span className="text-gray-700">{feature.growth}</span>
                )}
              </td>
              <td className="text-center py-4 px-4">
                {typeof feature.business === 'boolean' ? (
                  feature.business ? (
                    <Check className="w-5 h-5 text-green-500 inline" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 inline" />
                  )
                ) : (
                  <span className="text-gray-700">{feature.business}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
