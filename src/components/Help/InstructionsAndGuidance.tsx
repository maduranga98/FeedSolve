export function InstructionsAndGuidance() {
  return (
    <div className="space-y-8">
      {/* Instructions Section */}
      <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
        <h2 className="text-lg font-semibold text-[#1E3A5F] mb-4">How to Use Your Plan</h2>
        <div className="space-y-4 text-[#6B7B8D]">
          <div>
            <h3 className="font-semibold text-[#1E3A5F] mb-2">Getting Started</h3>
            <p>
              Log in to your FeedSolve account and start creating feedback boards. Each tier comes
              with a specific number of boards and submission limits to help you manage your feedback
              effectively.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-[#1E3A5F] mb-2">Managing Your Subscription</h3>
            <p>
              You can upgrade, downgrade, or cancel your subscription at any time from your billing
              dashboard. Changes take effect immediately for upgrades, or at the end of your billing
              cycle for downgrades.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-[#1E3A5F] mb-2">Features by Plan</h3>
            <p>
              Different plans unlock different features. Visit our pricing page to see a detailed
              comparison of all features available in each plan, and upgrade anytime to access
              premium features.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-[#1E3A5F] mb-2">Usage & Limits</h3>
            <p>
              Monitor your usage in the dashboard. Each plan has monthly submission limits and team
              member restrictions. The dashboard shows your current usage and how much quota remains.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-[#1E3A5F] mb-2">Team Management</h3>
            <p>
              Invite team members to collaborate on feedback collection and responses. Each plan
              allows a specific number of team members. Team members can be assigned different roles
              and permissions.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-[#1E3A5F] mb-2">Custom Branding</h3>
            <p>
              Available in Growth and Business plans, customize your feedback forms with your brand
              colors and logo to maintain consistency with your website and branding guidelines.
            </p>
          </div>
        </div>
      </div>

      {/* Support Section */}
      <div className="bg-[#EBF5FB] rounded-xl border border-[#2E86AB] p-6">
        <h2 className="text-lg font-semibold text-[#1E3A5F] mb-4">Help & Support</h2>
        <div className="space-y-4">
          <p className="text-[#6B7B8D]">
            Need assistance with your subscription, features, or have questions about your plan? Our
            dedicated support team is here to help you succeed with FeedSolve.
          </p>

          {/* Email Support */}
          <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-[#2E86AB]">
            <div className="w-10 h-10 bg-[#2E86AB] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 mt-1">
              ✉
            </div>
            <div>
              <p className="font-semibold text-[#1E3A5F] mb-1">Email Support</p>
              <a
                href="mailto:hello@feedsolve.com"
                className="text-[#2E86AB] hover:underline text-sm mb-2 block"
              >
                hello@feedsolve.com
              </a>
              <p className="text-xs text-[#6B7B8D]">
                Email us with any questions about billing, subscription management, features, or
                general inquiries. Our team typically responds within 24 hours.
              </p>
            </div>
          </div>

          {/* Common Questions */}
          <div className="mt-6">
            <h3 className="font-semibold text-[#1E3A5F] mb-3">Common Questions</h3>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-[#1E3A5F] text-sm mb-1">
                  Can I upgrade or downgrade anytime?
                </p>
                <p className="text-sm text-[#6B7B8D]">
                  Yes! Upgrades take effect immediately, and downgrades take effect at the end of
                  your billing cycle.
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#1E3A5F] text-sm mb-1">What payment methods do you accept?</p>
                <p className="text-sm text-[#6B7B8D]">
                  We accept all major credit cards through Stripe's secure payment processing.
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#1E3A5F] text-sm mb-1">
                  What happens when I exceed my plan limits?
                </p>
                <p className="text-sm text-[#6B7B8D]">
                  You'll receive notifications when approaching your limits. You can upgrade your
                  plan anytime to increase your submission quota.
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#1E3A5F] text-sm mb-1">
                  Can I export my data?
                </p>
                <p className="text-sm text-[#6B7B8D]">
                  Growth and Business plans offer CSV export for advanced analytics. Contact us for
                  enterprise data export solutions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
