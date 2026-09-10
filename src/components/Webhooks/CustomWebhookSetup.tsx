import { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import type { CustomWebhook } from '@/types';
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
        connectedAt: Timestamp.fromDate(new Date()),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save custom webhook');
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
            Endpoint URL *
          </label>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com/webhooks/feedsolve"
            className="w-full px-3 py-2 border border-[#d6cabf] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f5e6df]"
          />
          <p className="text-xs text-[#78716c] mt-1">
            FeedSolve will POST events to this URL with a signature header
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#3c3632] mb-2">
            Signing Secret *
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={secret}
                onChange={e => setSecret(e.target.value)}
                className="w-full px-3 py-2 border border-[#d6cabf] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f5e6df] pr-10"
                placeholder="64-character hex string"
              />
              <button
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a8a29e] hover:text-[#3c3632]"
              >
                {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              onClick={handleGenerateSecret}
              className="px-3 py-2 bg-[#f5f0ec] text-[#3c3632] rounded-xl hover:bg-[#f2ece6]"
            >
              Generate
            </button>
            <button
              onClick={handleCopySecret}
              className="px-3 py-2 bg-[#f5f0ec] text-[#3c3632] rounded-xl hover:bg-[#f2ece6]"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
          <p className="text-xs text-[#78716c] mt-1">
            Use this secret to verify webhook signatures
          </p>
        </div>

        <div className="bg-[#f5e6df] border border-[#e0d6cf] rounded-xl p-3">
          <p className="text-sm text-[#1c1917]">
            <strong>Signature Verification:</strong> Events will include a{' '}
            <code className="bg-[#f5e6df] px-1 rounded">X-FeedSolve-Signature</code> header with an
            HMAC SHA-256 signature. Use your secret to verify the signature.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#3c3632] mb-3">
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
