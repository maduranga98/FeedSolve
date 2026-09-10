import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import type { SlackWebhook } from '@/types';
import { WEBHOOK_EVENTS, MESSAGE_FORMATS } from '@/lib/webhooks';

interface SlackSetupProps {
  config?: SlackWebhook;
  onSave: (config: SlackWebhook) => Promise<void>;
  onCancel: () => void;
}

export function SlackSetup({ config, onSave, onCancel }: SlackSetupProps) {
  const [webhookUrl, setWebhookUrl] = useState(config?.webhookUrl || '');
  const [channelId, setChannelId] = useState(config?.channelId || '');
  const [selectedEvents, setSelectedEvents] = useState(config?.events || []);
  const [format, setFormat] = useState<'detailed' | 'compact' | 'minimal'>(
    config?.format || 'detailed'
  );
  const [mentionOnNew, setMentionOnNew] = useState(config?.mentionOnNew || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEventToggle = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId) ? prev.filter(e => e !== eventId) : [...prev, eventId]
    );
  };

  const handleSave = async () => {
    setError('');

    if (!webhookUrl.trim()) {
      setError('Webhook URL is required');
      return;
    }

    if (!webhookUrl.startsWith('https://hooks.slack.com/')) {
      setError('Invalid Slack webhook URL');
      return;
    }

    if (selectedEvents.length === 0) {
      setError('Select at least one event');
      return;
    }

    try {
      setLoading(true);
      await onSave({
        enabled: true,
        webhookUrl: webhookUrl.trim(),
        channelId: channelId || undefined,
        events: selectedEvents,
        format,
        mentionOnNew,
        connectedAt: Timestamp.fromDate(new Date()),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save Slack webhook');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {error && (
        <div className="mb-4 p-3 bg-[#FDECEA] border border-[#F1C0B8] rounded-xl flex items-start gap-2">
          <AlertCircle size={18} className="text-[#C0392B] mt-0.5" />
          <p className="text-sm text-[#C0392B]">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#3c3632] mb-2">
            Slack Webhook URL *
          </label>
          <input
            type="password"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
            className="w-full px-3 py-2 border border-[#d6cabf] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f5e6df]"
          />
          <p className="text-xs text-[#78716c] mt-1">
            Get this from Slack workspace settings → Apps → Incoming Webhooks
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#3c3632] mb-2">
            Channel ID (optional)
          </label>
          <input
            type="text"
            value={channelId}
            onChange={e => setChannelId(e.target.value)}
            placeholder="e.g., C1234567890"
            className="w-full px-3 py-2 border border-[#d6cabf] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f5e6df]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#3c3632] mb-2">
            Message Format
          </label>
          <div className="space-y-2">
            {MESSAGE_FORMATS.map(fmt => (
              <label key={fmt.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value={fmt.id}
                  checked={format === fmt.id}
                  onChange={e => setFormat(e.target.value as SlackWebhook['format'])}
                  className="w-4 h-4"
                />
                <span className="text-sm">
                  <span className="text-lg">{fmt.icon}</span> {fmt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={mentionOnNew}
              onChange={e => setMentionOnNew(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-[#3c3632]">Mention @channel on new submissions</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#3c3632] mb-3">
            Events to notify on *
          </label>
          <div className="space-y-2">
            {WEBHOOK_EVENTS.map(event => (
              <label key={event.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedEvents.includes(event.id)}
                  onChange={() => handleEventToggle(event.id)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-[#3c3632]">{event.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-[#3c3632] border border-[#d6cabf] rounded-xl hover:bg-[#f5f0ec] disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 bg-[#c0694a] text-white rounded-xl hover:bg-[#a85a3e] disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save & Connect'}
        </button>
      </div>
    </div>
  );
}
