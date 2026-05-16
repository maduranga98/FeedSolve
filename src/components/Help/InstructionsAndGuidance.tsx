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
              Available in Growth and Pro plans, customize your feedback forms with your brand
              colors and logo to maintain consistency with your website and branding guidelines.
            </p>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
        <h2 className="text-lg font-semibold text-[#1E3A5F] mb-4">Tips & How-To Guides</h2>
        <div className="space-y-5 text-[#6B7B8D] text-sm">
          <div>
            <h3 className="font-semibold text-[#1E3A5F] mb-2">How to use Reply Templates</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to <strong>Templates</strong> from the main navigation.</li>
              <li>Click <strong>Create Template</strong>, give it a title and the message body.</li>
              <li>Use placeholders like <code className="bg-[#F0F4F8] px-1 rounded">{'{{customer_name}}'}</code> for personalized replies.</li>
              <li>When replying to a submission, click <strong>Insert Template</strong> and pick your saved template.</li>
              <li>Edit before sending if you need to tweak the message for the specific submission.</li>
            </ol>
            <p className="mt-2 text-xs text-[#9AABBF]">Tip: Keep templates short and ask one question at a time — it speeds up resolution.</p>
          </div>

          <div>
            <h3 className="font-semibold text-[#1E3A5F] mb-2">How to use Escalation Rules</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open <strong>Settings → Escalation Rules</strong>.</li>
              <li>Click <strong>New Rule</strong> and choose a trigger (e.g. status is <em>received</em> for more than 24 hours).</li>
              <li>Set the action: notify a teammate, change priority, or reassign the submission.</li>
              <li>Save and toggle the rule on. The system will check rules automatically.</li>
            </ol>
            <p className="mt-2 text-xs text-[#9AABBF]">Tip: Start with one rule for critical priority and tune from there to avoid alert fatigue.</p>
          </div>

          <div>
            <h3 className="font-semibold text-[#1E3A5F] mb-2">How to use Merge Submissions</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>In the Submissions list, open the duplicate submission you want to merge.</li>
              <li>Click <strong>Merge</strong> and select the primary submission to merge into.</li>
              <li>Confirm — the merged submission stays linked to the primary one and is hidden by default.</li>
              <li>Toggle <strong>Show merged</strong> at the top of the list to review merged items later.</li>
            </ol>
            <p className="mt-2 text-xs text-[#9AABBF]">Tip: Merge only after you've confirmed the topic and reporter intent match — merges aren't easily reversible.</p>
          </div>

          <div>
            <h3 className="font-semibold text-[#1E3A5F] mb-2">How to use Location-tagged QR Codes</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open your board's settings and add the locations you operate (e.g. "Lobby", "Drive-through").</li>
              <li>Go to the <strong>QR codes</strong> section and download a QR per location.</li>
              <li>Display the QR at that physical location — incoming submissions are automatically tagged with the location.</li>
              <li>Filter the Analytics → <em>Submissions by Location</em> chart to compare locations.</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-[#1E3A5F] mb-2">How to read the Analytics report</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Pick a date range using the selector at the top of Analytics.</li>
              <li>Use the <strong>Report Builder</strong> on the Full Analytics tab to choose which sections to include.</li>
              <li>Click <strong>Generate Custom Report</strong> to download a tailored PDF with only the sections you ticked.</li>
              <li>Use <strong>Export CSV</strong> to get the raw submission list for pivot-table analysis.</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-[#1E3A5F] mb-2">How to invite team members</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to <strong>Team</strong> and click <strong>Invite Member</strong>.</li>
              <li>Enter their email and pick a role (Owner, Admin, Manager, or Viewer).</li>
              <li>The invitee receives an email link to join your workspace.</li>
              <li>Change roles or remove access at any time from the Team page.</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-[#1E3A5F] mb-2">How to track a submission as a customer</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>After submitting feedback, customers receive a unique tracking code.</li>
              <li>Direct them to the <strong>/track</strong> page or share the link with the code prefilled.</li>
              <li>Customers can see status updates and your public reply.</li>
            </ol>
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
                  Growth and Pro plans offer CSV export for advanced analytics. Contact us for
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
