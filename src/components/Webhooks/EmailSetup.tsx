import { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import type { EmailWebhook } from '@/types';
import { WEBHOOK_EVENTS, EMAIL_FREQUENCIES } from '@/lib/webhooks';

interface EmailSetupProps {
  config?: EmailWebhook;
  onSave: (config: EmailWebhook) => Promise<void>;
  onCancel: () => void;
}

export function EmailSetup({ config, onSave, onCancel }: EmailSetupProps) {
  const [emailInput, setEmailInput] = useState('');
  const [recipients, setRecipients] = useState(config?.recipients || []);
  const [selectedEvents, setSelectedEvents] = useState(config?.events || []);
  const [frequency, setFrequency] = useState<'instant' | 'daily_digest' | 'weekly_digest'>(
    config?.frequency || 'instant'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddEmail = () => {
    if (!emailInput.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      setError('Please enter a valid email address');
      return;
    }

    if (recipients.includes(emailInput)) {
      setError('This email is already added');
      return;
    }

    setRecipients([...recipients, emailInput]);
    setEmailInput('');
    setError('');
  };

  const handleRemoveEmail = (email: string) => {
    setRecipients(recipients.filter(e => e !== email));
  };

  const handleEventToggle = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId) ? prev.filter(e => e !== eventId) : [...prev, eventId]
    );
  };

  const handleSave = async () => {
    setError('');

    if (recipients.length === 0) {
      setError('Add at least one email recipient');
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
        recipients,
        events: selectedEvents,
        frequency,
        connectedAt: Timestamp.fromDate(new Date()),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save email webhook');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Setup Email Notifications</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle size={18} className="text-red-600 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Recipients *
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleAddEmail()}
              placeholder="your-email@example.com"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddEmail}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
          </div>

          <div className="space-y-2">
            {recipients.map(email => (
              <div
                key={email}
                className="flex items-center justify-between px-3 py-2 bg-gray-100 rounded-lg"
              >
                <span className="text-sm text-gray-700">{email}</span>
                <button
                  onClick={() => handleRemoveEmail(email)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notification Frequency
          </label>
          <div className="space-y-2">
            {EMAIL_FREQUENCIES.map(freq => (
              <label key={freq.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="frequency"
                  value={freq.id}
                  checked={frequency === freq.id}
                  onChange={e => setFrequency(e.target.value as any)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">{freq.label}</span>
              </label>
            ))}
          </div>
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
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
