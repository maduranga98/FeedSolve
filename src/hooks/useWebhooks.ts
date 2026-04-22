import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getCompanyWebhooks,
  updateSlackWebhook,
  updateEmailWebhook,
  updateCustomWebhook,
  deleteWebhook,
  toggleWebhook,
  getWebhookLogs,
  getWebhookLogsByType,
  getWebhookLogsByStatus,
} from '@/lib/webhooks';
import type {
  SlackWebhook,
  EmailWebhook,
  CustomWebhook,
  WebhookLog,
  WebhookConfig,
} from '@/types';
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import app from '@/lib/firebase';

export function useWebhooks() {
  const { user } = useAuth();
  const [webhooks, setWebhooks] = useState<WebhookConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchWebhooks = async () => {
      try {
        setLoading(true);
        const data = await getCompanyWebhooks(user.companyId);
        setWebhooks(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch webhooks');
      } finally {
        setLoading(false);
      }
    };

    fetchWebhooks();
  }, [user]);

  const updateSlack = async (config: SlackWebhook) => {
    if (!user) throw new Error('Not authenticated');
    await updateSlackWebhook(user.companyId, config);
    setWebhooks(prev => ({
      ...(prev || {}),
      slack: config,
      enabled: true,
    }));
  };

  const updateEmail = async (config: EmailWebhook) => {
    if (!user) throw new Error('Not authenticated');
    await updateEmailWebhook(user.companyId, config);
    setWebhooks(prev => ({
      ...(prev || {}),
      email: config,
      enabled: true,
    }));
  };

  const updateCustom = async (config: CustomWebhook) => {
    if (!user) throw new Error('Not authenticated');
    await updateCustomWebhook(user.companyId, config);
    setWebhooks(prev => ({
      ...(prev || {}),
      custom: config,
      enabled: true,
    }));
  };

  const deleteWebhookConfig = async (webhookType: 'slack' | 'email' | 'custom') => {
    if (!user) throw new Error('Not authenticated');
    await deleteWebhook(user.companyId, webhookType);
    setWebhooks(prev => {
      if (!prev) return prev;
      const updated = { ...prev };
      delete updated[webhookType];
      return updated;
    });
  };

  const toggleWebhookConfig = async (webhookType: 'slack' | 'email' | 'custom', enabled: boolean) => {
    if (!user) throw new Error('Not authenticated');
    await toggleWebhook(user.companyId, webhookType, enabled);
    setWebhooks(prev => {
      if (!prev || !prev[webhookType]) return prev;
      return {
        ...prev,
        [webhookType]: {
          ...prev[webhookType],
          enabled,
        },
      };
    });
  };

  return {
    webhooks,
    loading,
    error,
    updateSlack,
    updateEmail,
    updateCustom,
    deleteWebhookConfig,
    toggleWebhookConfig,
  };
}

export function useWebhookLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async (webhookType?: string, status?: string) => {
    if (!user) return;

    try {
      setLoading(true);
      let data: WebhookLog[] = [];

      if (webhookType) {
        data = await getWebhookLogsByType(user.companyId, webhookType);
      } else if (status) {
        data = await getWebhookLogsByStatus(user.companyId, status as any);
      } else {
        data = await getWebhookLogs(user.companyId);
      }

      setLogs(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  return { logs, loading, error, fetchLogs };
}

export function useTestWebhook() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testWebhook = async (webhookType: 'slack' | 'email' | 'custom') => {
    if (!user) throw new Error('Not authenticated');

    try {
      setLoading(true);
      setError(null);

      const functions = getFunctions(app);
      const testWebhookFn = httpsCallable(functions, 'testWebhook');
      const result = await testWebhookFn({
        companyId: user.companyId,
        webhookType,
      });

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to test webhook';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { testWebhook, loading, error };
}
