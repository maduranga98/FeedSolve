import { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { CustomWebhook } from '@/types';
import { WEBHOOK_EVENTS } from '@/lib/webhooks';

interface CustomWebhookSetupProps {
  config?: CustomWebhook;
  onSave: (config: CustomWebhook) => Promise<void>;
  onCancel: () => void;
}

export function CustomWebhookSetup({ config, onSave, onCancel }: CustomWebhookSetupProps) {
  const [url, setUrl] = useState(config?.url || '');
  const [secret, setSecret] = useState(config?.secret || '');
  const [showSecret, setShowSecret] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState(config?.events || []);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateSecret = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const newSecret = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    setSecret(newSecret);
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEventToggle = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId) ? prev.filter(e => e !== eventId) : [...prev, eventId]
    );
  };

  const handleSave = async () => {
    setError('');

    if (!url.trim()) {
      setError('Webhook URL is required');
      return;
    }

    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    if (!secret) {
      setError('Secret is required');
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
        url: url.trim(),
        secret,
        events: selectedEvents,
        connectedAt: new Date(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save custom webhook');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Setup Custom Webhook</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle size={18} className="text-red-600 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Endpoint URL *
          </label>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com/webhooks/feedsolve"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            FeedSolve will POST events to this URL with a signature header
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Signing Secret *
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={secret}
                onChange={e => setSecret(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                placeholder="64-character hex string"
              />
              <button
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              onClick={handleGenerateSecret}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Generate
            </button>
            <button
              onClick={handleCopySecret}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Use this secret to verify webhook signatures
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900">
            <strong>Signature Verification:</strong> Events will include a{' '}
            <code className="bg-blue-100 px-1 rounded">X-FeedSolve-Signature</code> header with an
            HMAC SHA-256 signature. Use your secret to verify the signature.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Events to send *
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
