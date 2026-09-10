import { useState } from 'react';
import { AlertCircle, Loader2, Mail } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import type { EmailWebhook } from '@/types';
import { WEBHOOK_EVENTS, EMAIL_FREQUENCIES } from '@/lib/webhooks';
import { EmailChipInput } from './EmailChipInput';

interface EmailSetupProps {
  config?: EmailWebhook;
  onSave: (config: EmailWebhook) => Promise<void>;
  onCancel: () => void;
}

type Frequency = EmailWebhook['frequency'];

const FREQUENCY_HINTS: Record<Frequency, string> = {
  instant: 'Sent the moment the event happens.',
  daily_digest: 'One roll-up email every day at 08:00 UTC.',
  weekly_digest: 'One roll-up email every Monday at 08:00 UTC.',
};

/** Company-wide email notification recipients, events and delivery frequency. */
export function EmailSetup({ config, onSave, onCancel }: EmailSetupProps) {
  const [recipients, setRecipients] = useState<string[]>(config?.recipients || []);
  const [selectedEvents, setSelectedEvents] = useState<string[]>(
    config?.events || ['submission.created']
  );
  const [frequency, setFrequency] = useState<Frequency>(config?.frequency || 'instant');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
    );
  };

  const handleSave = async () => {
    setError('');

    if (recipients.length === 0) {
      setError('Add at least one recipient address');
      return;
    }
    if (selectedEvents.length === 0) {
      setError('Select at least one event to be notified about');
      return;
    }

    try {
      setSaving(true);
      await onSave({
        enabled: config?.enabled ?? true,
        recipients,
        events: selectedEvents,
        frequency,
        connectedAt: config?.connectedAt ?? Timestamp.now(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save email notifications');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-xl bg-[#f5e6df] px-4 py-3">
        <Mail size={18} className="mt-0.5 shrink-0 text-[#c0694a]" />
        <p className="text-sm leading-6 text-[#3c3632]">
          Notifications are sent from <strong>hello@feedsolve.com</strong>. Add the addresses
          that should hear about new submissions — a shared inbox works well.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-[#F1C0B8] bg-[#FDECEA] px-4 py-3">
          <AlertCircle size={17} className="mt-0.5 shrink-0 text-[#C0392B]" />
          <p className="text-sm text-[#C0392B]">{error}</p>
        </div>
      )}

      <EmailChipInput
        label="Recipients"
        value={recipients}
        onChange={setRecipients}
        hint="Press Enter to add. These addresses receive notifications for every board."
      />

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-[#1c1917]">Notify me about</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {WEBHOOK_EVENTS.map(event => {
            const checked = selectedEvents.includes(event.id);
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
            const selected = frequency === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setFrequency(option.id as Frequency)}
                className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                  selected
                    ? 'border-[#c0694a] bg-[#f5e6df]'
                    : 'border-[#d6cabf] bg-white hover:border-[#c0694a]'
                }`}
              >
                <span className="block text-sm font-semibold text-[#1c1917]">{option.label}</span>
                <span className="mt-0.5 block text-xs leading-5 text-[#78716c]">
                  {FREQUENCY_HINTS[option.id as Frequency]}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl border border-[#d6cabf] px-4 py-2 text-sm font-semibold text-[#3c3632] transition-colors hover:bg-[#f5f0ec] disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c0694a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#a85a3e] disabled:opacity-50"
        >
          {saving && <Loader2 size={15} className="animate-spin" />}
          {saving ? 'Saving…' : 'Save notifications'}
        </button>
      </div>
    </div>
  );
}
