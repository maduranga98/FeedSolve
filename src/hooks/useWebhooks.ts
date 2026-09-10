import { useCallback, useEffect, useState } from 'react';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { useAuth } from '@/hooks/useAuth';
import app from '@/lib/firebase';
import {
  deleteChannel,
  getNotificationSettings,
  submitterPreferences,
  toggleChannel,
  updateBoardRecipients,
  updateCustomWebhook,
  updateEmailWebhook,
  updateSlackWebhook,
  updateSubmitterPreferences,
  type NotificationChannel,
} from '@/lib/notifications';
import {
  getWebhookLogs,
  getWebhookLogsByStatus,
  getWebhookLogsByType,
} from '@/lib/webhooks';
import type {
  BoardRecipients,
  CustomWebhook,
  EmailWebhook,
  NotificationSettings,
  SlackWebhook,
  SubmitterPreferences,
  WebhookLog,
} from '@/types';

/** Company notification settings: channels, per-board recipients, submitter emails. */
export function useNotificationSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const companyId = user?.companyId;

  const refresh = useCallback(async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      setSettings(await getNotificationSettings(companyId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const requireCompany = () => {
    if (!companyId) throw new Error('Not authenticated');
    return companyId;
  };

  const updateSlack = async (config: SlackWebhook) => {
    await updateSlackWebhook(requireCompany(), config);
    setSettings(prev => ({ ...(prev || {}), slack: config }));
  };

  const updateEmail = async (config: EmailWebhook) => {
    await updateEmailWebhook(requireCompany(), config);
    setSettings(prev => ({ ...(prev || {}), email: config }));
  };

  const updateCustom = async (config: CustomWebhook) => {
    await updateCustomWebhook(requireCompany(), config);
    setSettings(prev => ({ ...(prev || {}), custom: config }));
  };

  const removeChannel = async (channel: NotificationChannel) => {
    await deleteChannel(requireCompany(), channel);
    setSettings(prev => {
      if (!prev) return prev;
      const next = { ...prev };
      delete next[channel];
      return next;
    });
  };

  const setChannelEnabled = async (channel: NotificationChannel, enabled: boolean) => {
    await toggleChannel(requireCompany(), channel, enabled);
    setSettings(prev => {
      const current = prev?.[channel];
      if (!prev || !current) return prev;
      return { ...prev, [channel]: { ...current, enabled } };
    });
  };

  const setBoardRecipients = async (boardId: string, config: BoardRecipients | null) => {
    await updateBoardRecipients(requireCompany(), boardId, config);
    setSettings(prev => {
      const boardRecipients = { ...(prev?.boardRecipients || {}) };
      if (config) boardRecipients[boardId] = config;
      else delete boardRecipients[boardId];
      return { ...(prev || {}), boardRecipients };
    });
  };

  const setSubmitterPreferences = async (preferences: SubmitterPreferences) => {
    await updateSubmitterPreferences(requireCompany(), preferences);
    setSettings(prev => ({ ...(prev || {}), submitter: preferences }));
  };

  return {
    settings,
    submitter: submitterPreferences(settings),
    loading,
    error,
    refresh,
    updateSlack,
    updateEmail,
    updateCustom,
    removeChannel,
    setChannelEnabled,
    setBoardRecipients,
    setSubmitterPreferences,
  };
}

export function useWebhookLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const companyId = user?.companyId;

  const fetchLogs = useCallback(
    async (webhookType?: string, status?: string) => {
      if (!companyId) return;

      try {
        setLoading(true);
        let data: WebhookLog[] = [];

        if (webhookType) {
          data = await getWebhookLogsByType(companyId, webhookType);
        } else if (status) {
          data = await getWebhookLogsByStatus(companyId, status as WebhookLog['status']);
        } else {
          data = await getWebhookLogs(companyId);
        }

        setLogs(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch logs');
      } finally {
        setLoading(false);
      }
    },
    [companyId]
  );

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, error, fetchLogs };
}

export function useTestWebhook() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testWebhook = async (webhookType: NotificationChannel) => {
    if (!user) throw new Error('Not authenticated');

    try {
      setLoading(true);
      setError(null);

      const testWebhookFn = httpsCallable(getFunctions(app), 'testWebhook');
      const result = await testWebhookFn({
        companyId: user.companyId,
        webhookType,
      });

      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to test webhook';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { testWebhook, loading, error };
}
