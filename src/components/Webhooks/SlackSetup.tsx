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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Setup Slack Integration</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle size={18} className="text-red-600 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Slack Webhook URL *
          </label>
          <input
            type="password"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Get this from Slack workspace settings → Apps → Incoming Webhooks
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Channel ID (optional)
          </label>
          <input
            type="text"
            value={channelId}
            onChange={e => setChannelId(e.target.value)}
            placeholder="e.g., C1234567890"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  onChange={e => setFormat(e.target.value as any)}
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
            <span className="text-sm text-gray-700">Mention @channel on new submissions</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
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
                <span className="text-sm text-gray-700">{event.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save & Connect'}
        </button>
      </div>
    </div>
  );
}
