import { useEffect, useMemo, useState } from 'react';
import { Bell, Link2, Loader2, Mail, MessageSquare, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  useNotificationSettings,
  useTestWebhook,
  useWebhookLogs,
} from '@/hooks/useWebhooks';
import {
  BoardRecipientsCard,
  CustomWebhookSetup,
  EmailSetup,
  SlackSetup,
  SubmitterEmailsCard,
  WebhookCard,
  WebhookLogs,
} from '@/components/Webhooks';
import { addAuditLog, getCompanyBoards } from '@/lib/firestore';
import type {
  Board,
  BoardRecipients,
  CustomWebhook,
  EmailWebhook,
  SlackWebhook,
  SubmitterPreferences,
} from '@/types';

type Channel = 'slack' | 'email' | 'custom';

const CHANNEL_OPTIONS: Array<{
  id: Channel;
  label: string;
  description: string;
  icon: typeof Mail;
}> = [
  {
    id: 'email',
    label: 'Email',
    description: 'Alert a shared inbox instantly, or as a daily/weekly digest.',
    icon: Mail,
  },
  {
    id: 'slack',
    label: 'Slack',
    description: 'Post submission events straight into a channel.',
    icon: MessageSquare,
  },
  {
    id: 'custom',
    label: 'Custom webhook',
    description: 'POST signed event payloads to any endpoint.',
    icon: Link2,
  },
];

export function NotificationsPage() {
  const { user } = useAuth();
  const {
    settings,
    submitter,
    loading,
    error,
    updateSlack,
    updateEmail,
    updateCustom,
    removeChannel,
    setChannelEnabled,
    setBoardRecipients,
    setSubmitterPreferences,
  } = useNotificationSettings();
  const { logs, loading: logsLoading, fetchLogs } = useWebhookLogs();
  const { testWebhook } = useTestWebhook();

  const [boards, setBoards] = useState<Board[]>([]);
  const [setupMode, setSetupMode] = useState<Channel | null>(null);
  const [testingChannel, setTestingChannel] = useState<Channel | null>(null);

  useEffect(() => {
    document.title = 'Notifications | FeedSolve';
  }, []);

  useEffect(() => {
    if (!user) return;
    getCompanyBoards(user.companyId)
      .then(setBoards)
      .catch(() => toast.error('Failed to load boards'));
  }, [user]);

  const connected = useMemo(
    () => CHANNEL_OPTIONS.filter(option => Boolean(settings?.[option.id])),
    [settings]
  );
  const available = CHANNEL_OPTIONS.filter(option => !settings?.[option.id]);

  const logAction = (action: string, channel: string) => {
    if (!user) return;
    void addAuditLog(user.companyId, {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action,
      resourceType: 'webhook',
      resourceName: channel,
      details: { integrationType: channel },
    });
  };

  const withToast = async (run: () => Promise<void>, success: string, failure: string) => {
    try {
      await run();
      toast.success(success);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : failure);
      throw err;
    }
  };

  const handleSave = async (channel: Channel, config: SlackWebhook | EmailWebhook | CustomWebhook) => {
    const existed = Boolean(settings?.[channel]);
    const save = {
      slack: () => updateSlack(config as SlackWebhook),
      email: () => updateEmail(config as EmailWebhook),
      custom: () => updateCustom(config as CustomWebhook),
    }[channel];

    await withToast(save, existed ? 'Notification settings updated' : 'Notifications connected', 'Failed to save');
    logAction(`${existed ? 'Updated' : 'Connected'} ${channel} notifications`, channel);
    setSetupMode(null);
    await fetchLogs();
  };

  const handleTest = async (channel: Channel) => {
    try {
      setTestingChannel(channel);
      const result = (await testWebhook(channel)) as { message?: string };
      toast.success(result?.message || 'Test notification sent');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setTestingChannel(null);
      await fetchLogs();
    }
  };

  const handleDelete = async (channel: Channel) => {
    await withToast(() => removeChannel(channel), 'Integration removed', 'Failed to remove');
    logAction(`Disconnected ${channel} notifications`, channel);
    await fetchLogs();
  };

  const handleToggle = async (channel: Channel, enabled: boolean) => {
    await withToast(
      () => setChannelEnabled(channel, enabled),
      enabled ? 'Notifications resumed' : 'Notifications paused',
      'Failed to update'
    );
  };

  const handleBoardRecipients = async (boardId: string, config: BoardRecipients | null) => {
    await withToast(
      () => setBoardRecipients(boardId, config),
      config ? 'Board recipients saved' : 'Board recipients cleared',
      'Failed to save board recipients'
    );
  };

  const handleSubmitterPreferences = async (preferences: SubmitterPreferences) => {
    await withToast(
      () => setSubmitterPreferences(preferences),
      'Submitter emails updated',
      'Failed to update submitter emails'
    );
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f0ec]">
        <Loader2 className="animate-spin text-[#c0694a]" size={28} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f0ec] px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#f5e6df] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#c0694a]">
            <Bell size={14} /> Notifications
          </div>
          <h1 className="text-3xl font-bold text-[#1c1917]">Notifications</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#78716c]">
            Decide who hears about new submissions and what the submitter gets back. Emails are
            sent from <strong className="font-semibold text-[#3c3632]">hello@feedsolve.com</strong>.
          </p>
        </header>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-[#F1C0B8] bg-[#FDECEA] px-4 py-3">
            <AlertCircle size={17} className="mt-0.5 shrink-0 text-[#C0392B]" />
            <p className="text-sm text-[#C0392B]">{error}</p>
          </div>
        )}

        {connected.length > 0 && (
          <section className="grid gap-4">
            {connected.map(option => (
              <WebhookCard
                key={option.id}
                type={option.id}
                config={settings?.[option.id]}
                enabled={settings?.[option.id]?.enabled ?? false}
                onToggle={enabled => handleToggle(option.id, enabled)}
                onEdit={() => setSetupMode(option.id)}
                onDelete={() => handleDelete(option.id)}
                onTest={() => handleTest(option.id)}
                testing={testingChannel === option.id}
              />
            ))}
          </section>
        )}

        {setupMode && (
          <section className="rounded-2xl border border-[#e0d6cf] bg-white p-6">
            <h2 className="mb-5 text-base font-semibold text-[#1c1917]">
              {setupMode === 'email'
                ? 'Email notifications'
                : setupMode === 'slack'
                  ? 'Slack integration'
                  : 'Custom webhook'}
            </h2>

            {setupMode === 'email' && (
              <EmailSetup
                config={settings?.email}
                onSave={config => handleSave('email', config)}
                onCancel={() => setSetupMode(null)}
              />
            )}
            {setupMode === 'slack' && (
              <SlackSetup
                config={settings?.slack}
                onSave={config => handleSave('slack', config)}
                onCancel={() => setSetupMode(null)}
              />
            )}
            {setupMode === 'custom' && (
              <CustomWebhookSetup
                config={settings?.custom}
                onSave={config => handleSave('custom', config)}
                onCancel={() => setSetupMode(null)}
              />
            )}
          </section>
        )}

        {!setupMode && available.length > 0 && (
          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1c1917]">
              {connected.length ? 'Add another channel' : 'Choose a channel'}
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {available.map(option => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSetupMode(option.id)}
                    className="rounded-2xl border border-[#e0d6cf] bg-white p-5 text-left transition-colors hover:border-[#c0694a]"
                  >
                    <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5e6df] text-[#c0694a]">
                      <Icon size={18} />
                    </span>
                    <span className="block text-sm font-semibold text-[#1c1917]">{option.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-[#78716c]">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <SubmitterEmailsCard preferences={submitter} onSave={handleSubmitterPreferences} />

        <BoardRecipientsCard
          boards={boards}
          boardRecipients={settings?.boardRecipients ?? {}}
          companyRecipients={settings?.email?.recipients ?? []}
          onSave={handleBoardRecipients}
        />

        <WebhookLogs logs={logs} loading={logsLoading} onRefresh={fetchLogs} />
      </div>
    </main>
  );
}
