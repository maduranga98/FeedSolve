import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Link2,
  Loader2,
  Mail,
  MessageSquare,
  MoreVertical,
} from 'lucide-react';
import type { CustomWebhook, EmailWebhook, SlackWebhook } from '@/types';
import { EMAIL_FREQUENCIES, WEBHOOK_EVENTS } from '@/lib/webhooks';

type ChannelType = 'slack' | 'email' | 'custom';

interface WebhookCardProps {
  type: ChannelType;
  config: SlackWebhook | EmailWebhook | CustomWebhook | undefined;
  enabled: boolean;
  onToggle: (enabled: boolean) => Promise<void>;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onTest: () => Promise<void>;
  testing?: boolean;
  error?: string;
}

const CHANNEL_META: Record<ChannelType, { label: string; icon: typeof Mail }> = {
  slack: { label: 'Slack', icon: MessageSquare },
  email: { label: 'Email notifications', icon: Mail },
  custom: { label: 'Custom webhook', icon: Link2 },
};

const eventLabel = (id: string) =>
  WEBHOOK_EVENTS.find(event => event.id === id)?.label ?? id;

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8f8680]">{label}</p>
      <div className="mt-1 text-sm text-[#3c3632]">{children}</div>
    </div>
  );
}

export function WebhookCard({
  type,
  config,
  enabled,
  onToggle,
  onEdit,
  onDelete,
  onTest,
  testing = false,
  error,
}: WebhookCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [busy, setBusy] = useState<'toggle' | 'delete' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showMenu]);

  if (!config) return null;

  const meta = CHANNEL_META[type];
  const Icon = meta.icon;

  const handleToggle = async () => {
    try {
      setBusy('toggle');
      await onToggle(!enabled);
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Remove the ${meta.label.toLowerCase()} integration?`)) return;
    try {
      setBusy('delete');
      await onDelete();
    } finally {
      setBusy(null);
    }
  };

  const menuItem =
    'block w-full px-4 py-2.5 text-left text-sm text-[#3c3632] transition-colors hover:bg-[#f5f0ec] disabled:opacity-50';

  return (
    <article className="rounded-2xl border border-[#e0d6cf] bg-white p-6">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5e6df] text-[#c0694a]">
            <Icon size={18} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-[#1c1917]">{meta.label}</h3>
            {error ? (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-[#C0392B]">
                <AlertCircle size={13} /> {error}
              </p>
            ) : (
              <p
                className={`mt-0.5 flex items-center gap-1 text-xs ${
                  enabled ? 'text-[#2E7D5B]' : 'text-[#8f8680]'
                }`}
              >
                {enabled ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                {enabled ? 'Active' : 'Paused'}
              </p>
            )}
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu(value => !value)}
            aria-label="Integration options"
            className="rounded-lg p-2 text-[#8f8680] transition-colors hover:bg-[#f5f0ec]"
          >
            <MoreVertical size={18} />
          </button>

          {showMenu && (
            <div className="absolute right-0 z-10 mt-1 w-48 overflow-hidden rounded-xl border border-[#e0d6cf] bg-white py-1 shadow-lg">
              <button
                type="button"
                className={menuItem}
                onClick={() => {
                  onEdit();
                  setShowMenu(false);
                }}
              >
                Edit settings
              </button>
              <button
                type="button"
                className={menuItem}
                disabled={busy === 'toggle'}
                onClick={() => {
                  void handleToggle();
                  setShowMenu(false);
                }}
              >
                {enabled ? 'Pause notifications' : 'Resume notifications'}
              </button>
              <button
                type="button"
                className={menuItem}
                disabled={!enabled || testing}
                onClick={() => {
                  void onTest();
                  setShowMenu(false);
                }}
              >
                {testing ? 'Sending test…' : 'Send test'}
              </button>
              <button
                type="button"
                className={`${menuItem} text-[#C0392B] hover:bg-[#FDECEA]`}
                disabled={busy === 'delete'}
                onClick={() => {
                  void handleDelete();
                  setShowMenu(false);
                }}
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="space-y-3">
        {type === 'email' && 'recipients' in config && (
          <>
            <Detail label={`Recipients (${config.recipients.length})`}>
              <ul className="flex flex-wrap gap-1.5">
                {config.recipients.map(email => (
                  <li key={email} className="rounded-full bg-[#f5e6df] px-2.5 py-1 text-xs">
                    {email}
                  </li>
                ))}
              </ul>
            </Detail>
            <Detail label="Delivery">
              {EMAIL_FREQUENCIES.find(item => item.id === config.frequency)?.label ??
                config.frequency}
            </Detail>
            <Detail label="Events">{config.events.map(eventLabel).join(' · ')}</Detail>
          </>
        )}

        {type === 'slack' && 'webhookUrl' in config && (
          <>
            {config.channelId && <Detail label="Channel">#{config.channelId}</Detail>}
            <Detail label="Events">{config.events.map(eventLabel).join(' · ')}</Detail>
          </>
        )}

        {type === 'custom' && 'url' in config && (
          <>
            <Detail label="Endpoint">
              <span className="block truncate font-mono text-xs">{config.url}</span>
            </Detail>
            <Detail label="Events">{config.events.map(eventLabel).join(' · ')}</Detail>
          </>
        )}
      </div>

      <footer className="mt-5 flex items-center justify-between gap-3 border-t border-[#f2ece6] pt-4">
        <p className="text-xs text-[#8f8680]">
          Connected {config.connectedAt?.toDate?.().toLocaleDateString() ?? 'recently'}
        </p>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={`${meta.label} enabled`}
          onClick={handleToggle}
          disabled={busy === 'toggle'}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
            enabled ? 'bg-[#c0694a]' : 'bg-[#d6cabf]'
          }`}
        >
          {busy === 'toggle' ? (
            <Loader2 size={13} className="mx-auto animate-spin text-white" />
          ) : (
            <span
              className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-[22px]' : 'translate-x-1'
              }`}
            />
          )}
        </button>
      </footer>
    </article>
  );
}
