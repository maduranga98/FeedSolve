import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Mail, Send } from 'lucide-react';
import type { EmailNotificationConfig, UserRole } from '@/types';
import {
  DEFAULT_EMAIL_CONFIG,
  EMAIL_FREQUENCIES,
  NOTIFIABLE_ROLES,
  NOTIFICATION_EVENTS,
} from '@/lib/notifications';
import { EmailChipInput } from './EmailChipInput';

interface EmailNotificationsCardProps {
  config?: EmailNotificationConfig;
  /** How many team members hold each role, for the "2 people" hint. */
  roleCounts: Record<UserRole, number>;
  onSave: (config: EmailNotificationConfig) => Promise<void>;
  onToggle: (enabled: boolean) => Promise<void>;
  onTest: () => Promise<void>;
  testing?: boolean;
}

/** Who gets an email when a submission comes in: by team role, plus extra addresses. */
export function EmailNotificationsCard({
  config,
  roleCounts,
  onSave,
  onToggle,
  onTest,
  testing = false,
}: EmailNotificationsCardProps) {
  const [draft, setDraft] = useState<EmailNotificationConfig>(config ?? DEFAULT_EMAIL_CONFIG);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (config) setDraft(config);
  }, [config]);

  const recipientCount =
    draft.roles.reduce((total, role) => total + (roleCounts[role] ?? 0), 0) +
    draft.recipients.length;

  const toggleRole = (role: UserRole) =>
    setDraft(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(item => item !== role)
        : [...prev.roles, role],
    }));

  const toggleEvent = (eventId: string) =>
    setDraft(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(item => item !== eventId)
        : [...prev.events, eventId],
    }));

  const handleSave = async () => {
    setError('');
    if (!draft.roles.length && !draft.recipients.length) {
      setError('Pick at least one role, or add an email address');
      return;
    }
    if (!draft.events.length) {
      setError('Select at least one event to be notified about');
      return;
    }

    try {
      setSaving(true);
      await onSave(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    try {
      setToggling(true);
      await onToggle(!draft.enabled);
      setDraft(prev => ({ ...prev, enabled: !prev.enabled }));
    } finally {
      setToggling(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#e0d6cf] bg-white p-6">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5e6df] text-[#c0694a]">
            <Mail size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[#1c1917]">Email notifications</h2>
            <p className="mt-0.5 text-sm leading-6 text-[#78716c]">
              Sent from <strong className="font-semibold text-[#3c3632]">hello@feedsolve.com</strong>{' '}
              when a submission comes in.
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={draft.enabled}
          aria-label="Email notifications enabled"
          onClick={handleToggle}
          disabled={toggling}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
            draft.enabled ? 'bg-[#c0694a]' : 'bg-[#d6cabf]'
          }`}
        >
          {toggling ? (
            <Loader2 size={13} className="mx-auto animate-spin text-white" />
          ) : (
            <span
              className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white transition-transform ${
                draft.enabled ? 'translate-x-[22px]' : 'translate-x-1'
              }`}
            />
          )}
        </button>
      </header>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-[#F1C0B8] bg-[#FDECEA] px-4 py-3">
          <AlertCircle size={17} className="mt-0.5 shrink-0 text-[#C0392B]" />
          <p className="text-sm text-[#C0392B]">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <fieldset>
          <legend className="text-sm font-semibold text-[#1c1917]">Notify these roles</legend>
          <p className="mb-2 text-xs text-[#78716c]">
            Everyone on your team with the role gets the email — no need to update this when
            people join or leave.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {NOTIFIABLE_ROLES.map(role => {
              const checked = draft.roles.includes(role.id);
              const count = roleCounts[role.id] ?? 0;
              return (
                <label
                  key={role.id}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 transition-colors ${
                    checked
                      ? 'border-[#c0694a] bg-[#f5e6df]'
                      : 'border-[#d6cabf] bg-white hover:border-[#c0694a]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleRole(role.id)}
                    className="mt-0.5 h-4 w-4 accent-[#c0694a]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[#1c1917]">
                      {role.label}
                      <span className="ml-1.5 font-normal text-[#8f8680]">
                        ({count} {count === 1 ? 'person' : 'people'})
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-[#78716c]">
                      {role.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <EmailChipInput
          label="Also notify these addresses"
          value={draft.recipients}
          onChange={recipients => setDraft(prev => ({ ...prev, recipients }))}
          hint="Optional — a shared inbox or someone outside the team. Press Enter to add."
        />

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-[#1c1917]">Notify about</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {NOTIFICATION_EVENTS.map(event => {
              const checked = draft.events.includes(event.id);
              return (
                <label
                  key={event.id}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                    checked
                      ? 'border-[#c0694a] bg-[#f5e6df] text-[#1c1917]'
                      : 'border-[#d6cabf] bg-white text-[#3c3632] hover:border-[#c0694a]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleEvent(event.id)}
                    className="h-4 w-4 accent-[#c0694a]"
                  />
                  {event.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-[#1c1917]">Delivery</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {EMAIL_FREQUENCIES.map(option => {
              const selected = draft.frequency === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setDraft(prev => ({ ...prev, frequency: option.id }))}
                  className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                    selected
                      ? 'border-[#c0694a] bg-[#f5e6df]'
                      : 'border-[#d6cabf] bg-white hover:border-[#c0694a]'
                  }`}
                >
                  <span className="block text-sm font-semibold text-[#1c1917]">{option.label}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-[#78716c]">
                    {option.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      <footer className="mt-6 flex flex-col gap-3 border-t border-[#f2ece6] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[#8f8680]">
          {recipientCount === 0
            ? 'Nobody is set to receive notifications yet.'
            : `${recipientCount} recipient${recipientCount === 1 ? '' : 's'} will be notified.`}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onTest}
            disabled={testing || recipientCount === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#d6cabf] px-3.5 py-2 text-sm font-semibold text-[#3c3632] transition-colors hover:bg-[#f5f0ec] disabled:opacity-50"
          >
            {testing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {testing ? 'Sending…' : 'Send test'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#c0694a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#a85a3e] disabled:opacity-50"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </footer>
    </section>
  );
}
