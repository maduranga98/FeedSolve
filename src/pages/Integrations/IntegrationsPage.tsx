import { useState } from 'react';
import { Loader } from 'lucide-react';
import { useWebhooks, useWebhookLogs, useTestWebhook } from '@/hooks/useWebhooks';
import { WebhookCard } from '@/components/Webhooks/WebhookCard';
import { SlackSetup } from '@/components/Webhooks/SlackSetup';
import { EmailSetup } from '@/components/Webhooks/EmailSetup';
import { CustomWebhookSetup } from '@/components/Webhooks/CustomWebhookSetup';
import { WebhookLogs } from '@/components/Webhooks/WebhookLogs';
import type { SlackWebhook, EmailWebhook, CustomWebhook } from '@/types';

type SetupMode = null | 'slack' | 'email' | 'custom';

export function IntegrationsPage() {
  const { webhooks, loading, error, updateSlack, updateEmail, updateCustom, deleteWebhookConfig, toggleWebhookConfig } =
    useWebhooks();
  const { logs, loading: logsLoading, fetchLogs } = useWebhookLogs();
  const { testWebhook } = useTestWebhook();

  const [setupMode, setSetupMode] = useState<SetupMode>(null);
  const [testingWebhook, setTestingWebhook] = useState<SetupMode>(null);

  const handleSlackSave = async (config: SlackWebhook) => {
    try {
      await updateSlack(config);
      setSetupMode(null);
      await fetchLogs();
    } catch (err) {
      console.error('Failed to save Slack webhook:', err);
    }
  };

  const handleEmailSave = async (config: EmailWebhook) => {
    try {
      await updateEmail(config);
      setSetupMode(null);
      await fetchLogs();
    } catch (err) {
      console.error('Failed to save Email webhook:', err);
    }
  };

  const handleCustomSave = async (config: CustomWebhook) => {
    try {
      await updateCustom(config);
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
      await fetchLogs();
    } catch (err) {
      console.error('Failed to delete webhook:', err);
    }
  };

  const handleToggleWebhook = async (type: 'slack' | 'email' | 'custom', enabled: boolean) => {
    try {
      await toggleWebhookConfig(type, enabled);
    } catch (err) {
      console.error('Failed to toggle webhook:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-600 mt-2">
          Connect external services to get notifications for submission events
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Connected Webhooks */}
      {(webhooks?.slack || webhooks?.email || webhooks?.custom) && (
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Connected Integrations</h2>
          <div className="grid gap-4">
            {webhooks?.slack && (
              <WebhookCard
                type="slack"
                config={webhooks.slack}
                enabled={webhooks.slack.enabled}
                onToggle={enabled => handleToggleWebhook('slack', enabled)}
                onEdit={() => setSetupMode('slack')}
                onDelete={() => handleDeleteWebhook('slack')}
                onTest={() => handleTestWebhook('slack')}
                testing={testingWebhook === 'slack'}
              />
            )}

            {webhooks?.email && (
              <WebhookCard
                type="email"
                config={webhooks.email}
                enabled={webhooks.email.enabled}
                onToggle={enabled => handleToggleWebhook('email', enabled)}
                onEdit={() => setSetupMode('email')}
                onDelete={() => handleDeleteWebhook('email')}
                onTest={() => handleTestWebhook('email')}
                testing={testingWebhook === 'email'}
              />
            )}

            {webhooks?.custom && (
              <WebhookCard
                type="custom"
                config={webhooks.custom}
                enabled={webhooks.custom.enabled}
                onToggle={enabled => handleToggleWebhook('custom', enabled)}
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
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {setupMode === 'slack'
              ? 'Setup Slack Integration'
              : setupMode === 'email'
                ? 'Setup Email Notifications'
                : 'Setup Custom Webhook'}
          </h2>

          {setupMode === 'slack' && (
            <SlackSetup
              config={webhooks?.slack}
              onSave={handleSlackSave}
              onCancel={() => setSetupMode(null)}
            />
          )}

          {setupMode === 'email' && (
            <EmailSetup
              config={webhooks?.email}
              onSave={handleEmailSave}
              onCancel={() => setSetupMode(null)}
            />
          )}

          {setupMode === 'custom' && (
            <CustomWebhookSetup
              config={webhooks?.custom}
              onSave={handleCustomSave}
              onCancel={() => setSetupMode(null)}
            />
          )}
        </div>
      )}

      {/* Add New Integration Buttons */}
      {!setupMode && (
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Add New Integration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {!webhooks?.slack && (
              <button
                onClick={() => setSetupMode('slack')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
              >
                <div className="text-3xl mb-2">💬</div>
                <div className="font-semibold text-gray-900">Slack</div>
                <div className="text-sm text-gray-600 mt-1">Get Slack notifications</div>
              </button>
            )}

            {!webhooks?.email && (
              <button
                onClick={() => setSetupMode('email')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
              >
                <div className="text-3xl mb-2">📧</div>
                <div className="font-semibold text-gray-900">Email</div>
                <div className="text-sm text-gray-600 mt-1">Email notifications</div>
              </button>
            )}

            {!webhooks?.custom && (
              <button
                onClick={() => setSetupMode('custom')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
              >
                <div className="text-3xl mb-2">🔗</div>
                <div className="font-semibold text-gray-900">Custom Webhook</div>
                <div className="text-sm text-gray-600 mt-1">POST to custom URL</div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Webhook Logs */}
      <WebhookLogs logs={logs} loading={logsLoading} onRefresh={fetchLogs} />
    </div>
  );
}
