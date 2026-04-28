import { useState } from 'react';
import { AlertCircle, CheckCircle2, MoreVertical } from 'lucide-react';
import type { SlackWebhook, EmailWebhook, CustomWebhook } from '@/types';

interface WebhookCardProps {
  type: 'slack' | 'email' | 'custom';
  config: SlackWebhook | EmailWebhook | CustomWebhook | undefined;
  enabled: boolean;
  onToggle: (enabled: boolean) => Promise<void>;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onTest: () => Promise<void>;
  testing?: boolean;
  error?: string;
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
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async () => {
    try {
      setToggling(true);
      await onToggle(!enabled);
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Delete ${type} webhook?`)) {
      try {
        setDeleting(true);
        await onDelete();
      } finally {
        setDeleting(false);
      }
    }
  };

  const getTypeInfo = () => {
    const info: Record<string, { label: string; icon: string; color: string }> = {
      slack: { label: 'Slack', icon: '💬', color: 'bg-blue-500' },
      email: { label: 'Email', icon: '📧', color: 'bg-red-500' },
      custom: { label: 'Custom Webhook', icon: '🔗', color: 'bg-purple-500' },
    };
    return info[type];
  };

  const info = getTypeInfo();

  if (!config) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`${info.color} text-white p-2 rounded-lg`}>
            <span className="text-lg">{info.icon}</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{info.label}</h3>
            {error && <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle size={14} /> {error}
            </p>}
            {!error && enabled && (
              <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle2 size={14} /> Connected
              </p>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical size={20} className="text-gray-500" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <button
                onClick={() => {
                  onEdit();
                  setShowMenu(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 border-b"
              >
                Edit Settings
              </button>
              <button
                onClick={() => {
                  handleToggle();
                  setShowMenu(false);
                }}
                disabled={toggling}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 border-b disabled:opacity-50"
              >
                {enabled ? 'Disable' : 'Enable'}
              </button>
              <button
                onClick={() => {
                  onTest();
                  setShowMenu(false);
                }}
                disabled={!enabled || testing}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 border-b disabled:opacity-50"
              >
                {testing ? 'Testing...' : 'Send Test'}
              </button>
              <button
                onClick={() => {
                  handleDelete();
                  setShowMenu(false);
                }}
                disabled={deleting}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {type === 'slack' && 'webhookUrl' in config && (
          <>
            <div>
              <label className="text-sm text-gray-600">Webhook URL</label>
              <p className="text-sm font-mono text-gray-700 truncate">
                {config.webhookUrl.substring(0, 50)}...
              </p>
            </div>
            {config.channelId && (
              <div>
                <label className="text-sm text-gray-600">Channel</label>
                <p className="text-sm text-gray-700">#{config.channelId}</p>
              </div>
            )}
            <div>
              <label className="text-sm text-gray-600">Events ({config.events.length})</label>
              <p className="text-sm text-gray-700">{config.events.join(', ')}</p>
            </div>
          </>
        )}

        {type === 'email' && 'recipients' in config && (
          <>
            <div>
              <label className="text-sm text-gray-600">Recipients ({config.recipients.length})</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {config.recipients.map(email => (
                  <span key={email} className="px-2 py-1 bg-gray-100 rounded text-sm">
                    {email}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Frequency</label>
              <p className="text-sm text-gray-700 capitalize">{config.frequency}</p>
            </div>
          </>
        )}

        {type === 'custom' && 'url' in config && (
          <>
            <div>
              <label className="text-sm text-gray-600">Endpoint URL</label>
              <p className="text-sm font-mono text-gray-700 truncate">{config.url}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Events ({config.events.length})</label>
              <p className="text-sm text-gray-700">{config.events.join(', ')}</p>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Connected {config.connectedAt?.toDate?.().toLocaleDateString() || 'recently'}
        </p>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={() => handleToggle()}
            disabled={toggling}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm text-gray-600">{enabled ? 'Active' : 'Inactive'}</span>
        </label>
      </div>
    </div>
  );
}
