import { useTranslation } from 'react-i18next';

export function InstructionsAndGuidance() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      {/* Instructions Section */}
      <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
        <h2 className="text-lg font-semibold text-[#1E3A5F] mb-4">{t('help.how_to_use')}</h2>
        <div className="space-y-4 text-[#6B7B8D]">
          <div>
            <h3 className="font-semibold text-[#1E3A5F] mb-2">{t('help.getting_started')}</h3>
            <p>{t('help.getting_started_desc')}</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#1E3A5F] mb-2">{t('help.managing_subscription')}</h3>
            <p>{t('help.managing_subscription_desc')}</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#1E3A5F] mb-2">{t('help.features_by_plan')}</h3>
            <p>{t('help.features_by_plan_desc')}</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#1E3A5F] mb-2">{t('help.usage_limits')}</h3>
            <p>{t('help.usage_limits_desc')}</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#1E3A5F] mb-2">{t('help.team_management')}</h3>
            <p>{t('help.team_management_desc')}</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#1E3A5F] mb-2">{t('help.custom_branding')}</h3>
            <p>{t('help.custom_branding_desc')}</p>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
        <h2 className="text-lg font-semibold text-[#1E3A5F] mb-4">{t('help.tips_title')}</h2>
        <div className="space-y-5 text-[#6B7B8D] text-sm">
          <div>
            <h3 className="font-semibold text-[#1E3A5F] mb-2">{t('help.tip_reply_templates')}</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_reply_1') }} />
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_reply_2') }} />
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_reply_3') }} />
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_reply_4') }} />
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_reply_5') }} />
            </ol>
            <p className="mt-2 text-xs text-[#9AABBF]">{t('help.tip_reply_hint')}</p>
          </div>

          <div>
            <h3 className="font-semibold text-[#1E3A5F] mb-2">{t('help.tip_escalation')}</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_escalation_1') }} />
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_escalation_2') }} />
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_escalation_3') }} />
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_escalation_4') }} />
            </ol>
            <p className="mt-2 text-xs text-[#9AABBF]">{t('help.tip_escalation_hint')}</p>
          </div>

          <div>
            <h3 className="font-semibold text-[#1E3A5F] mb-2">{t('help.tip_merge')}</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_merge_1') }} />
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_merge_2') }} />
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_merge_3') }} />
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_merge_4') }} />
            </ol>
            <p className="mt-2 text-xs text-[#9AABBF]">{t('help.tip_merge_hint')}</p>
          </div>

          <div>
            <h3 className="font-semibold text-[#1E3A5F] mb-2">{t('help.tip_location_qr')}</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_location_1') }} />
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_location_2') }} />
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_location_3') }} />
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_location_4') }} />
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-[#1E3A5F] mb-2">{t('help.tip_analytics')}</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_analytics_1') }} />
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_analytics_2') }} />
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_analytics_3') }} />
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_analytics_4') }} />
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-[#1E3A5F] mb-2">{t('help.tip_invite')}</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_invite_1') }} />
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_invite_2') }} />
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_invite_3') }} />
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_invite_4') }} />
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-[#1E3A5F] mb-2">{t('help.tip_track')}</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_track_1') }} />
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_track_2') }} />
              <li dangerouslySetInnerHTML={{ __html: t('help.tip_track_3') }} />
            </ol>
          </div>
        </div>
      </div>

      {/* Support Section */}
      <div className="bg-[#EBF5FB] rounded-xl border border-[#2E86AB] p-6">
        <h2 className="text-lg font-semibold text-[#1E3A5F] mb-4">{t('help.support_title')}</h2>
        <div className="space-y-4">
          <p className="text-[#6B7B8D]">{t('help.support_desc')}</p>

          {/* Email Support */}
          <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-[#2E86AB]">
            <div className="w-10 h-10 bg-[#2E86AB] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 mt-1">
              ✉
            </div>
            <div>
              <p className="font-semibold text-[#1E3A5F] mb-1">{t('help.email_support')}</p>
              <a
                href="mailto:hello@feedsolve.com"
                className="text-[#2E86AB] hover:underline text-sm mb-2 block"
              >
                hello@feedsolve.com
              </a>
              <p className="text-xs text-[#6B7B8D]">{t('help.email_support_desc')}</p>
            </div>
          </div>

          {/* Common Questions */}
          <div className="mt-6">
            <h3 className="font-semibold text-[#1E3A5F] mb-3">{t('help.common_questions')}</h3>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-[#1E3A5F] text-sm mb-1">{t('help.faq_upgrade_q')}</p>
                <p className="text-sm text-[#6B7B8D]">{t('help.faq_upgrade_a')}</p>
              </div>
              <div>
                <p className="font-semibold text-[#1E3A5F] text-sm mb-1">{t('help.faq_payment_q')}</p>
                <p className="text-sm text-[#6B7B8D]">{t('help.faq_payment_a')}</p>
              </div>
              <div>
                <p className="font-semibold text-[#1E3A5F] text-sm mb-1">{t('help.faq_limits_q')}</p>
                <p className="text-sm text-[#6B7B8D]">{t('help.faq_limits_a')}</p>
              </div>
              <div>
                <p className="font-semibold text-[#1E3A5F] text-sm mb-1">{t('help.faq_export_q')}</p>
                <p className="text-sm text-[#6B7B8D]">{t('help.faq_export_a')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
