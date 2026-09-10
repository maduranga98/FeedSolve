import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  useNotificationLogs,
  useNotificationSettings,
  useTestNotification,
} from '@/hooks/useNotifications';
import {
  BoardRecipientsCard,
  EmailNotificationsCard,
  NotificationLogs,
} from '@/components/Notifications';
import { addAuditLog, getCompanyBoards, getTeamMembers } from '@/lib/firestore';
import type {
  Board,
  BoardRecipients,
  EmailNotificationConfig,
  NotifiableRole,
  TeamMember,
} from '@/types';

const EMPTY_ROLE_COUNTS: Record<NotifiableRole, number> = {
  admin: 0,
  manager: 0,
  viewer: 0,
};

export function NotificationsPage() {
  const { user } = useAuth();
  const {
    settings,
    loading,
    error,
    saveEmailConfig,
    setEmailEnabled,
    setBoardRecipients,
  } = useNotificationSettings();
  const { logs, loading: logsLoading, fetchLogs } = useNotificationLogs();
  const { sendTest, sending } = useTestNotification();

  const [boards, setBoards] = useState<Board[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);

  useEffect(() => {
    document.title = 'Notifications | FeedSolve';
  }, []);

  useEffect(() => {
    if (!user) return;
    Promise.all([getCompanyBoards(user.companyId), getTeamMembers(user.companyId)])
      .then(([companyBoards, members]) => {
        setBoards(companyBoards);
        setTeam(members);
      })
      .catch(() => toast.error('Failed to load boards and team members'));
  }, [user]);

  const roleCounts = useMemo(
    () =>
      team.reduce((counts, member) => {
        // Roles are stored with inconsistent casing in older documents.
        const role = String(member.role).toLowerCase() as NotifiableRole;
        if (role in counts) counts[role] += 1;
        return counts;
      }, { ...EMPTY_ROLE_COUNTS }),
    [team]
  );

  const logAction = (action: string) => {
    if (!user) return;
    void addAuditLog(user.companyId, {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action,
      resourceType: 'settings',
      resourceName: 'Email notifications',
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

  const handleSaveEmail = async (config: EmailNotificationConfig) => {
    await withToast(
      () => saveEmailConfig(config),
      'Notification settings saved',
      'Failed to save notification settings'
    );
    logAction('Updated email notification settings');
  };

  const handleToggleEmail = async (enabled: boolean) => {
    await withToast(
      () => setEmailEnabled(enabled),
      enabled ? 'Email notifications on' : 'Email notifications paused',
      'Failed to update notifications'
    );
  };

  const handleTest = async () => {
    try {
      const result = await sendTest();
      toast.success(result.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Test failed');
    } finally {
      await fetchLogs();
    }
  };

  const handleBoardRecipients = async (boardId: string, config: BoardRecipients | null) => {
    await withToast(
      () => setBoardRecipients(boardId, config),
      config ? 'Board recipients saved' : 'Board recipients cleared',
      'Failed to save board recipients'
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
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#f5e6df] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#c0694a]">
            <Bell size={14} /> Notifications
          </div>
          <h1 className="text-3xl font-bold text-[#1c1917]">Notifications</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#78716c]">
            Choose who on your team gets an email when a submission comes in.
          </p>
        </header>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-[#F1C0B8] bg-[#FDECEA] px-4 py-3">
            <AlertCircle size={17} className="mt-0.5 shrink-0 text-[#C0392B]" />
            <p className="text-sm text-[#C0392B]">{error}</p>
          </div>
        )}

        <EmailNotificationsCard
          key={settings?.email ? 'configured' : 'new'}
          config={settings?.email}
          roleCounts={roleCounts}
          onSave={handleSaveEmail}
          onToggle={handleToggleEmail}
          onTest={handleTest}
          testing={sending}
        />

        <BoardRecipientsCard
          boards={boards}
          boardRecipients={settings?.boardRecipients ?? {}}
          onSave={handleBoardRecipients}
        />

        <NotificationLogs logs={logs} loading={logsLoading} onRefresh={fetchLogs} />
      </div>
    </main>
  );
}
