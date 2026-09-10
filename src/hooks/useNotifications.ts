import { useCallback, useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '@/hooks/useAuth';
import app from '@/lib/firebase';
import {
  getNotificationLogs,
  getNotificationSettings,
  setEmailNotificationsEnabled,
  submitterPreferences,
  updateBoardRecipients,
  updateEmailNotifications,
  updateSubmitterPreferences,
} from '@/lib/notifications';
import type {
  BoardRecipients,
  EmailNotificationConfig,
  NotificationLog,
  NotificationSettings,
  SubmitterPreferences,
} from '@/types';

/** Company notification settings: email rule, per-board recipients, submitter emails. */
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

  const saveEmailConfig = async (config: EmailNotificationConfig) => {
    await updateEmailNotifications(requireCompany(), config);
    setSettings(prev => ({ ...(prev || {}), email: config }));
  };

  const setEmailEnabled = async (enabled: boolean) => {
    await setEmailNotificationsEnabled(requireCompany(), enabled);
    setSettings(prev =>
      prev?.email ? { ...prev, email: { ...prev.email, enabled } } : prev
    );
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
    saveEmailConfig,
    setEmailEnabled,
    setBoardRecipients,
    setSubmitterPreferences,
  };
}

export function useNotificationLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const companyId = user?.companyId;

  const fetchLogs = useCallback(
    async (status?: NotificationLog['status']) => {
      if (!companyId) return;
      try {
        setLoading(true);
        setLogs(await getNotificationLogs(companyId, { status }));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load delivery history');
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

interface TestResult {
  success: boolean;
  recipients: number;
  message: string;
}

export function useTestNotification() {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);

  const sendTest = async (): Promise<TestResult> => {
    if (!user) throw new Error('Not authenticated');
    try {
      setSending(true);
      const callable = httpsCallable<{ companyId: string }, TestResult>(
        getFunctions(app),
        'sendTestNotification'
      );
      const result = await callable({ companyId: user.companyId });
      return result.data;
    } finally {
      setSending(false);
    }
  };

  return { sendTest, sending };
}
