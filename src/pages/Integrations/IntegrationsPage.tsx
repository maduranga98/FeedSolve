import { useState } from 'react';
import { Loader, Zap, AlertCircle } from 'lucide-react';
import { useWebhooks, useWebhookLogs, useTestWebhook } from '@/hooks/useWebhooks';
import { WebhookCard } from '@/components/Webhooks/WebhookCard';
import { SlackSetup } from '@/components/Webhooks/SlackSetup';
import { EmailSetup } from '@/components/Webhooks/EmailSetup';
import { CustomWebhookSetup } from '@/components/Webhooks/CustomWebhookSetup';
import { WebhookLogs } from '@/components/Webhooks/WebhookLogs';
import type { SlackWebhook, EmailWebhook, CustomWebhook } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { addAuditLog } from '@/lib/firestore';

type SetupMode = null | 'slack' | 'email' | 'custom';

export function IntegrationsPage() {
  const { user } = useAuth();
  const {
    webhooks,
    loading,
    error,
    updateSlack,
    updateEmail,
    updateCustom,
    deleteWebhookConfig,
    toggleWebhookConfig,
  } = useWebhooks();
  const { logs, loading: logsLoading, fetchLogs } = useWebhookLogs();
  const { testWebhook } = useTestWebhook();

  const [setupMode, setSetupMode] = useState<SetupMode>(null);
  const [testingWebhook, setTestingWebhook] = useState<SetupMode>(null);

  const logWebhookAction = (action: string, type: string) => {
    if (!user) return;
    void addAuditLog(user.companyId, {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action,
      resourceType: 'webhook',
      resourceName: type,
      details: { integrationType: type },
    });
  };

  const handleSlackSave = async (config: SlackWebhook) => {
    try {
      await updateSlack(config);
      logWebhookAction(webhooks?.slack ? 'Updated Slack integration' : 'Connected Slack integration', 'Slack');
      setSetupMode(null);
      await fetchLogs();
    } catch (err) {
      console.error('Failed to save Slack webhook:', err);
    }
  };

  const handleEmailSave = async (config: EmailWebhook) => {
    try {
      await updateEmail(config);
      logWebhookAction(webhooks?.email ? 'Updated Email integration' : 'Connected Email integration', 'Email');
      setSetupMode(null);
      await fetchLogs();
    } catch (err) {
      console.error('Failed to save Email webhook:', err);
    }
  };

  const handleCustomSave = async (config: CustomWebhook) => {
    try {
      await updateCustom(config);
      logWebhookAction(webhooks?.custom ? 'Updated Custom webhook' : 'Connected Custom webhook', 'Custom');
      setSetupMode(null);
      await fetchLogs();
    } catch (err) {
      console.error('Failed to save Custom webhook:', err);
    }
  };

  const handleTestWebhook = async (type: 'slack' | 'email' | 'custom') => {
    try {
      setTestingWebhook(type);
      await testWebhook(type);
      await fetchLogs();
    } catch (err) {
      console.error('Failed to test webhook:', err);
    } finally {
      setTestingWebhook(null);
    }
  };

  const handleDeleteWebhook = async (type: 'slack' | 'email' | 'custom') => {
    try {
      await deleteWebhookConfig(type);
      logWebhookAction(`Disconnected ${type.charAt(0).toUpperCase() + type.slice(1)} integration`, type);
      await fetchLogs();
    } catch (err) {
      console.error('Failed to delete webhook:', err);
    }
  };

  const handleToggleWebhook = async (
    type: 'slack' | 'email' | 'custom',
    enabled: boolean
  ) => {
    try {
      await toggleWebhookConfig(type, enabled);
    } catch (err) {
      console.error('Failed to toggle webhook:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FA] flex items-center justify-center">
        <Loader className="animate-spin text-[#2E86AB]" size={32} />
      </div>
    );
  }

  // Determine which integrations are connected (exclude null values from previous bug)
  const hasSlack = !!webhooks?.slack;
  const hasEmail = !!webhooks?.email;
  const hasCustom = !!webhooks?.custom;
  const hasAnyConnected = hasSlack || hasEmail || hasCustom;

  return (
    <div className="min-h-screen bg-[#F4F7FA]">
      {/* Page header */}
      <div className="bg-white border-b border-[#E8ECF0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#EBF5FB] rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-[#2E86AB]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1E3A5F]">Integrations</h1>
              <p className="text-sm text-[#6B7B8D] mt-0.5">
                Connect external services to receive notifications for submission events.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Error banner */}
        {error && (
          <div className="bg-[#FFE5E5] border border-[#E74C3C] rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-[#E74C3C] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#E74C3C]">{error}</p>
          </div>
        )}

        {/* Connected Webhooks */}
        {hasAnyConnected && (
          <div>
            <h2 className="text-lg font-semibold text-[#1E3A5F] mb-4">
              Connected Integrations
            </h2>
            <div className="grid gap-4">
              {hasSlack && webhooks?.slack && (
                <WebhookCard
                  type="slack"
                  config={webhooks.slack}
                  enabled={webhooks.slack.enabled}
                  onToggle={(enabled) => handleToggleWebhook('slack', enabled)}
                  onEdit={() => setSetupMode('slack')}
                  onDelete={() => handleDeleteWebhook('slack')}
                  onTest={() => handleTestWebhook('slack')}
                  testing={testingWebhook === 'slack'}
                />
              )}
              {hasEmail && webhooks?.email && (
                <WebhookCard
                  type="email"
                  config={webhooks.email}
                  enabled={webhooks.email.enabled}
                  onToggle={(enabled) => handleToggleWebhook('email', enabled)}
                  onEdit={() => setSetupMode('email')}
                  onDelete={() => handleDeleteWebhook('email')}
                  onTest={() => handleTestWebhook('email')}
                  testing={testingWebhook === 'email'}
                />
              )}
              {hasCustom && webhooks?.custom && (
                <WebhookCard
                  type="custom"
                  config={webhooks.custom}
                  enabled={webhooks.custom.enabled}
                  onToggle={(enabled) => handleToggleWebhook('custom', enabled)}
                  onEdit={() => setSetupMode('custom')}
                  onDelete={() => handleDeleteWebhook('custom')}
                  onTest={() => handleTestWebhook('custom')}
                  testing={testingWebhook === 'custom'}
                />
              )}
            </div>
          </div>
        )}

        {/* Setup Forms */}
        {setupMode && (
          <div className="bg-white border border-[#E8ECF0] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[#1E3A5F] mb-4">
              {setupMode === 'slack'
                ? 'Setup Slack Integration'
                : setupMode === 'email'
                  ? 'Setup Email Notifications'
                  : 'Setup Custom Webhook'}
            </h2>

            {setupMode === 'slack' && (
              <SlackSetup
                config={webhooks?.slack ?? undefined}
                onSave={handleSlackSave}
                onCancel={() => setSetupMode(null)}
              />
            )}
            {setupMode === 'email' && (
              <EmailSetup
                config={webhooks?.email ?? undefined}
                onSave={handleEmailSave}
                onCancel={() => setSetupMode(null)}
              />
            )}
            {setupMode === 'custom' && (
              <CustomWebhookSetup
                config={webhooks?.custom ?? undefined}
                onSave={handleCustomSave}
                onCancel={() => setSetupMode(null)}
              />
            )}
          </div>
        )}

        {/* Add New Integration */}
        {!setupMode && (
          <div>
            <h2 className="text-lg font-semibold text-[#1E3A5F] mb-4">
              {hasAnyConnected ? 'Add Another Integration' : 'Available Integrations'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {!hasSlack && (
                <button
                  onClick={() => setSetupMode('slack')}
                  className="p-5 bg-white border border-[#E8ECF0] rounded-xl hover:border-[#2E86AB] hover:shadow-md transition-all text-center group"
                >
                  <div className="text-3xl mb-3">💬</div>
                  <div className="font-semibold text-[#1E3A5F] group-hover:text-[#2E86AB] transition-colors">
                    Slack
                  </div>
                  <div className="text-sm text-[#6B7B8D] mt-1">
                    Get real-time Slack notifications
                  </div>
                </button>
              )}
              {!hasEmail && (
                <button
                  onClick={() => setSetupMode('email')}
                  className="p-5 bg-white border border-[#E8ECF0] rounded-xl hover:border-[#2E86AB] hover:shadow-md transition-all text-center group"
                >
                  <div className="text-3xl mb-3">📧</div>
                  <div className="font-semibold text-[#1E3A5F] group-hover:text-[#2E86AB] transition-colors">
                    Email
                  </div>
                  <div className="text-sm text-[#6B7B8D] mt-1">
                    Instant or digest email alerts
                  </div>
                </button>
              )}
              {!hasCustom && (
                <button
                  onClick={() => setSetupMode('custom')}
                  className="p-5 bg-white border border-[#E8ECF0] rounded-xl hover:border-[#2E86AB] hover:shadow-md transition-all text-center group"
                >
                  <div className="text-3xl mb-3">🔗</div>
                  <div className="font-semibold text-[#1E3A5F] group-hover:text-[#2E86AB] transition-colors">
                    Custom Webhook
                  </div>
                  <div className="text-sm text-[#6B7B8D] mt-1">
                    POST events to any URL
                  </div>
                </button>
              )}
              {hasSlack && hasEmail && hasCustom && (
                <div className="md:col-span-3 text-center py-6 text-sm text-[#9AABBF]">
                  All available integrations are connected.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Webhook Logs */}
        <div className="bg-white border border-[#E8ECF0] rounded-xl overflow-hidden">
          <WebhookLogs logs={logs} loading={logsLoading} onRefresh={fetchLogs} />
        </div>
      </div>
    </div>
  );
}
